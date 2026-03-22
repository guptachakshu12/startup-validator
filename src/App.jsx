import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Rocket,
  Loader2,
  Send,
  RefreshCw,
  Bot,
  User,
} from "lucide-react";

const promptSuggestions = [
  "AI assistant for college students to manage assignments",
  "Hyperlocal pet care marketplace for busy professionals",
  "Subscription box for healthy office snacks",
  "SaaS tool that converts meeting notes into project tasks",
];

const analyzeIdea = async (idea, type = "validation") => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env file."
    );
  }

  let prompt = "";

  if (type === "validation") {
    prompt = `
You are a startup idea validation expert.

Analyze the startup idea and return ONLY valid JSON with these exact keys:
summary,
marketScore,
audience,
monetization,
risks,
improvements,
positioning

Rules:
- marketScore must be a number from 0 to 10
- monetization, risks, improvements must be arrays of short strings
- summary should be 2-3 sentences
- audience should be one concise paragraph
- positioning should be one strong sentence
- Return only raw JSON
- Do not use markdown
- Do not wrap in backticks

Startup idea: ${idea}
`;
  }

  if (type === "improve") {
    prompt = `
You are a startup product expert.

Suggest improvements for this startup idea.

Return ONLY valid JSON with these exact keys:
summary,
marketScore,
audience,
monetization,
risks,
improvements,
positioning

Rules:
- marketScore must be a number from 0 to 10
- summary should explain how the idea can become stronger
- risks should mention what may hold the product back
- improvements should focus on product features, differentiation, execution, and user experience
- monetization should remain realistic
- audience should stay aligned to the same startup
- positioning should reflect a stronger version of the idea
- Return only raw JSON
- Do not use markdown
- Do not wrap in backticks

Startup idea: ${idea}
`;
  }

  if (type === "competitor") {
    prompt = `
You are a startup strategist.

Give a competitor analysis for this startup idea.

Return ONLY valid JSON with these exact keys:
summary,
marketScore,
audience,
monetization,
risks,
improvements,
positioning

Rules:
- marketScore must be a number from 0 to 10
- summary should give a competitor overview and mention direct or indirect competitors where relevant
- audience should still describe the target customer for this startup
- monetization can mention how competitors monetize if relevant
- risks should focus heavily on competitive threats and market pressure
- improvements should focus on differentiation strategies and market gaps
- positioning should explain how this startup can stand out against alternatives
- Return only raw JSON
- Do not use markdown
- Do not wrap in backticks

Startup idea: ${idea}
`;
  }

  if (type === "gtm") {
    prompt = `
You are a growth strategist.

Suggest a go-to-market strategy for this startup idea.

Return ONLY valid JSON with these exact keys:
summary,
marketScore,
audience,
monetization,
risks,
improvements,
positioning

Rules:
- marketScore must be a number from 0 to 10
- summary should explain the most practical launch approach
- audience should identify the first target user segment for launch
- monetization should suggest pricing or revenue approach
- risks should focus on launch and acquisition challenges
- improvements should focus on launch channels, messaging, onboarding, pricing, and early traction strategy
- positioning should reflect how to present the startup in the market
- Return only raw JSON
- Do not use markdown
- Do not wrap in backticks

Startup idea: ${idea}
`;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Gemini API error:", data);
    throw new Error(
      data?.error?.message || "Failed to get response from Gemini"
    );
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("Unexpected Gemini response:", data);
    throw new Error("No response text from Gemini");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

function ScoreRing({ score }) {
  const safeScore = Number(score) || 0;
  const percentage = Math.max(0, Math.min(100, safeScore * 10));
  const strokeDasharray = 282.6;
  const strokeDashoffset =
    strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
      <svg
        className="h-28 w-28 -rotate-90 sm:h-32 sm:w-32"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-200"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-slate-900 transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {safeScore}/10
        </div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-xs">
          Market Score
        </div>
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-2">
          <Icon className="h-5 w-5 text-slate-800" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="text-sm leading-6 text-slate-600">{children}</div>
    </motion.div>
  );
}

function AiAnalysisBubble({ data, onFollowUp, originalIdea }) {
  return (
    <div className="w-full max-w-[900px] space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-semibold text-slate-700">
            Startup Advisor
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 text-center">
            <ScoreRing score={data.marketScore} />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Validation Snapshot
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {data.summary}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">
                Positioning
              </h3>
            </div>

            <p className="text-sm leading-7 text-slate-600">
              {data.positioning}
            </p>

            <div className="mt-4 rounded-2xl bg-white p-4">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Best-fit audience
              </div>
              <div className="text-sm leading-6 text-slate-700">
                {data.audience}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ResultCard icon={BarChart3} title="Monetization">
          <ul className="space-y-2">
            {data.monetization?.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2">
                • {item}
              </li>
            ))}
          </ul>
        </ResultCard>

        <ResultCard icon={AlertTriangle} title="Risks">
          <ul className="space-y-2">
            {data.risks?.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2">
                • {item}
              </li>
            ))}
          </ul>
        </ResultCard>

        <ResultCard icon={DollarSign} title="Improvements">
          <ul className="space-y-2">
            {data.improvements?.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2">
                • {item}
              </li>
            ))}
          </ul>
        </ResultCard>
      </div>
    </div>
  );
}

export default function App() {
  const [idea, setIdea] = useState("");
  const [originalIdea, setOriginalIdea] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const canAnalyze = useMemo(() => idea.trim().length > 8, [idea]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAnalyze = async (selectedIdea) => {
    let finalPrompt = "";
    let userBubbleText = "";
    let requestType = "validation";

    if (typeof selectedIdea === "object" && selectedIdea !== null) {
      const { type, idea: baseIdea, label } = selectedIdea;

      requestType = type;
      userBubbleText = label || "Follow-up";
      finalPrompt = baseIdea;
    } else {
      finalPrompt = (selectedIdea ?? idea).trim();
      userBubbleText = finalPrompt;
      requestType = "validation";

      if (!finalPrompt) {
        setError("Please enter a startup idea first.");
        return;
      }

      if (finalPrompt.length < 8) {
        setError(
          "Add a little more detail so the idea can be analyzed properly."
        );
        return;
      }

      setOriginalIdea(finalPrompt);
    }

    if (!finalPrompt) return;

    setIdea("");
    setError("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: userBubbleText }]);

    try {
      const data = await analyzeIdea(finalPrompt, requestType);
      setMessages((prev) => [...prev, { role: "ai", content: data }]);
    } catch (e) {
      console.error(e);
      setError(e.message || "AI response failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIdea("");
    setOriginalIdea("");
    setMessages([]);
    setError("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                <Sparkles className="h-4 w-4" />
                Startup Idea Validator Chatbot
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                Chat with an AI startup idea validator.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Describe an idea, get structured feedback, then continue refining
                it like a real conversation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-50 p-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold">Chat</div>
                <div className="text-xs text-slate-500">Conversation flow</div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold">AI</div>
                <div className="text-xs text-slate-500">Live analysis</div>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Start the conversation</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Send an idea like a chat message instead of filling a form.
                </p>
              </div>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Chat
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <textarea
                value={idea}
                onChange={(e) => {
                  setIdea(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Describe your startup idea here... include the problem, target users, and what makes it unique."
                className="min-h-[160px] w-full resize-none rounded-2xl border-0 bg-white p-4 text-sm leading-6 outline-none placeholder:text-slate-400"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {idea.trim().length} characters
                </span>

                <button
                  onClick={() => handleAnalyze()}
                  disabled={!canAnalyze || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {loading ? "Analyzing..." : "Send Message"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6">
              <div className="mb-3 text-sm font-medium text-slate-700">
                Suggested first prompts
              </div>
              <div className="flex flex-wrap gap-3">
                {promptSuggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleAnalyze(item)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2">
                <Rocket className="h-5 w-5 text-slate-800" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">How this chatbot helps</h2>
                <p className="text-sm text-slate-500">
                  It responds like a focused startup advisor, not a generic bot.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                "Analyzes who the product is actually for",
                "Estimates market potential",
                "Suggests monetization paths",
                "Highlights risks and weak spots",
                "Improves positioning and clarity",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-sm leading-6 text-slate-600">
                The goal is to make validation feel conversational first, while
                still showing structured insight when needed.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Conversation
            </h2>
          </div>

          {messages.length === 0 && !loading && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Sparkles className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                No messages yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Send your first startup idea to begin the chat.
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <div className="space-y-5">
              {messages.map((msg, index) => (
                <motion.div
                  key={`${msg.role}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="flex max-w-[80%] items-start gap-3">
                      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                        {msg.content}
                      </div>
                      <div className="mt-1 rounded-full bg-slate-100 p-2">
                        <User className="h-4 w-4 text-slate-700" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full items-start gap-3">
                      <div className="mt-1 rounded-full bg-slate-100 p-2">
                        <Bot className="h-4 w-4 text-slate-700" />
                      </div>
                      <AiAnalysisBubble
                        data={msg.content}
                        onFollowUp={handleAnalyze}
                        originalIdea={originalIdea}
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-slate-100 p-2">
                      <Bot className="h-4 w-4 text-slate-700" />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking through your startup idea...
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}