import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, CalendarDays, Sparkles, Share2 } from "lucide-react";

/** <<< ВСТАВЬ СВОЙ DISCORD WEBHOOK ТУТ >>> */
const WEBHOOK_URL = "https://discord.com/api/webhooks/1409501240509075588/WZbm87MXoGfO1vQVtWDBeyDJ_w6c9kesLMkkl3VxbtvESOuh-rurbY28bEgkiwJVSxnw"; // замените на свой

/** Таймер до цели */
function useCountdown(targetISO = "2025-09-27T00:00:00+02:00") {
  const target = useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, diff };
}

/** Конфетти: phase 'off' | 'on' | 'fading' */
function useConfetti(phase) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const onResize = () => {
      W = (canvas.width = window.innerWidth);
      H = (canvas.height = window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#B98AFF"];
    const pieces = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H,
      r: 6 + Math.random() * 8,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vr: -0.05 + Math.random() * 0.1,
    }));

    let startFade = 0;
    const fadeDuration = 1500;
    let running = false;

    function tick(ts = 0) {
      ctx.clearRect(0, 0, W, H);

      let alpha = 1;
      if (phase === "fading") {
        if (!startFade) startFade = ts || performance.now();
        const elapsed = (ts || performance.now()) - startFade;
        alpha = Math.max(0, 1 - elapsed / fadeDuration);
        if (alpha === 0) {
          cancelAnimationFrame(rafRef.current);
          return;
        }
      }
      ctx.globalAlpha = alpha;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > H + 20) {
          p.y = -20;
          p.x = Math.random() * W;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    if (phase === "on" || phase === "fading") {
      if (!running) {
        running = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, W, H);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  return canvasRef;
}

export default function LoveDay() {
  const TARGET = "2025-09-27T00:00:00+02:00";
  const { days, hours, minutes, seconds, diff } = useCountdown(TARGET);
  const partyTime = diff === 0;

  const [confettiPhase, setConfettiPhase] = useState("off"); // 'off' | 'on' | 'fading'
  const canvasRef = useConfetti(confettiPhase);

  const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost");
  const to = url.searchParams.get("for") || "тебя";
  const headline = url.searchParams.get("title") || "До важного дня";

  const [revealed, setRevealed] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [answer, setAnswer] = useState(null); // null | 'yes' | 'no'
  const [sending, setSending] = useState(false);

  // Уведомление в Discord о клике
  const notifyDiscord = async (choice) => {
    // если вебхук не указан — выходим молча
    if (!WEBHOOK_URL || WEBHOOK_URL.includes("XXXXXXXX")) return;
    if (sending) return; // анти-даблклик
    setSending(true);
    try {
      const payload = {
        username: "Love Day Bot",
        content: null,
        embeds: [
          {
            title: "Ответ получен",
            description:
              choice === "yes"
                ? "Она нажала **Согласна** 💖"
                : "Она нажала **Не согласна**",
            color: choice === "yes" ? 0xff4d6d : 0x6b7280,
            fields: [
              { name: "Кому", value: String(to), inline: true },
              { name: "URL", value: window.location.href, inline: false },
              {
                name: "Время",
                value: new Date().toLocaleString("ru-RU"),
                inline: true,
              },
            ],
            footer: { text: "Answer-gift" },
          },
        ],
      };

      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Webhook error:", e);
    } finally {
      setSending(false);
    }
  };

  // При наступлении времени: показать текст, сердце на 5с и конфетти с плавным затуханием
  useEffect(() => {
    if (partyTime) {
      setRevealed(true);
      setConfettiPhase("on");
      setShowHeart(true);

      const hideHeart = setTimeout(() => {
        setShowHeart(false);
        setConfettiPhase("fading");
      }, 5000);

      return () => clearTimeout(hideHeart);
    }
  }, [partyTime]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Ссылка скопирована! ✨");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 via-white to-rose-50 text-gray-900 relative overflow-hidden">
      {/* Конфетти */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />

      {/* Большое сердце (5 секунд, с плавным появлением/исчезновением) */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            aria-hidden
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-rose-600 drop-shadow-xl"
            >
              <Heart className="w-40 h-40 fill-rose-600" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="p-3 bg-rose-100 rounded-2xl shadow"
            >
              <Heart className="w-6 h-6" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{headline}: 27 сентября</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> Europe/Berlin
              </p>
            </div>
          </div>
          <button
            onClick={copyShare}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-xl shadow hover:shadow-md active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" /> Поделиться
          </button>
        </header>

        <main className="mt-12">
          {/* Таймер */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "дней", value: days },
              { label: "часов", value: hours },
              { label: "мин", value: minutes },
              { label: "сек", value: seconds },
            ].map((b, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-6 text-center">
                <div className="text-4xl font-extrabold tabular-nums">{String(b.value).padStart(2, "0")}</div>
                <div className="mt-2 text-sm text-gray-500">{b.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Карточка с текстом и выбором ответа */}
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-10">
            <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10">
              <div className="flex items-center gap-2 text-rose-600 font-semibold uppercase tracking-wide text-xs">
                <Sparkles className="w-4 h-4" /> Сюрприз
              </div>

              {!revealed ? (
                <div>
                  <h2 className="mt-4 text-xl md:text-2xl font-bold">Сообщение откроется 27 сентября</h2>
                  <p className="mt-2 text-gray-600">А пока — сохраняй ссылку и возвращайся в этот день.</p>
                </div>
              ) : (
                <div>
                  <h2 className="mt-4 text-2xl md:text-3xl font-extrabold">Для {to}</h2>

                  {/* Если ответа ещё нет — показываем две кнопки */}
                  {answer === null && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={async () => {
                          setAnswer("yes");
                          await notifyDiscord("yes");
                        }}
                        disabled={sending}
                        className="px-5 py-3 rounded-2xl bg-rose-600 text-white font-medium shadow hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                      >
                        Согласна стать моей девушкой 💖
                      </button>
                      <button
                        onClick={async () => {
                          setAnswer("no");
                          await notifyDiscord("no");
                        }}
                        disabled={sending}
                        className="px-5 py-3 rounded-2xl bg-white border font-medium shadow hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                      >
                        Не согласна
                      </button>
                    </div>
                  )}

                  {/* Если «да» — показываем твой текст */}
                  {answer === "yes" && (
                    <div className="mt-6 text-lg leading-relaxed space-y-4">
                      <p>Влада 💖</p>
                      <p>Сегодня для меня особенный день. Спасибо тебе за ответ и за то, что впустила меня в своё сердце.</p>
                      <p>С этого момента я хочу быть рядом — поддерживать, радовать и делать твою жизнь хотя бы чуть-чуть светлее.</p>
                      <p>
                        Ты удивительный человек, и я счастлив, что могу называть тебя своей.{" "}
                        <span className="font-semibold">Давай будем рядом</span>.
                      </p>
                    </div>
                  )}

                  {/* Если «нет» — ничего не выводим */}
                  {answer === "no" && <div className="mt-6" />}
                </div>
              )}
            </div>
          </motion.div>
        </main>

        <footer className="mt-12 text-center text-sm text-gray-500">Сделано с любовью.</footer>
      </div>
    </div>
  );
}
