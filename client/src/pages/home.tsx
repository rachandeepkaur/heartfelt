import { useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Heart, Gift, Cake, Star, Sparkles, ArrowRight, ArrowLeft,
  Download, RotateCcw, Check, Loader2, Copy, PartyPopper,
  Upload, ImageIcon, SunDim, Droplets, Eye, Palette, Play, Video,
  Wand2, Send, Paintbrush, MessageCircleHeart, Quote, ChevronLeft, ChevronRight
} from "lucide-react";

const OCCASIONS = [
  { id: "valentine", label: "Valentine's Day", icon: Heart, color: "from-pink-400/20 to-rose-400/20", iconColor: "text-pink-500" },
  { id: "birthday", label: "Birthday", icon: Cake, color: "from-amber-300/20 to-orange-300/20", iconColor: "text-amber-500" },
  { id: "anniversary", label: "Anniversary", icon: Star, color: "from-purple-400/20 to-violet-400/20", iconColor: "text-purple-500" },
  { id: "thank-you", label: "Thank You", icon: Gift, color: "from-emerald-300/20 to-teal-300/20", iconColor: "text-emerald-500" },
  { id: "congratulations", label: "Congratulations", icon: PartyPopper, color: "from-sky-300/20 to-blue-300/20", iconColor: "text-sky-500" },
  { id: "just-because", label: "Just Because", icon: Sparkles, color: "from-rose-300/20 to-pink-300/20", iconColor: "text-rose-400" },
];

const TONES = [
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "funny", label: "Funny", icon: Sparkles },
  { id: "heartfelt", label: "Heartfelt", icon: Star },
  { id: "poetic", label: "Poetic", icon: Gift },
];

const BACKGROUNDS = [
  { id: "romantic-roses", label: "Romantic Roses", image: "/images/bg-romantic-roses.png" },
  { id: "birthday-joy", label: "Birthday Joy", image: "/images/bg-birthday-joy.png" },
  { id: "lavender-dream", label: "Lavender Dream", image: "/images/bg-lavender-dream.png" },
  { id: "golden-elegance", label: "Golden Elegance", image: "/images/bg-golden-elegance.png" },
  { id: "sunset-warmth", label: "Sunset Warmth", image: "/images/bg-sunset-warmth.png" },
  { id: "cherry-blossom", label: "Cherry Blossom", image: "/images/bg-cherry-blossom.png" },
];

interface CanvasSettings {
  opacity: number;
  blur: number;
  brightness: number;
}

const DEFAULT_CANVAS: CanvasSettings = { opacity: 100, blur: 0, brightness: 100 };

function generateConfettiData(count: number) {
  const colors = ["#f9a8d4", "#c4b5fd", "#fcd34d", "#fdba74", "#a7f3d0", "#fda4af"];
  return Array.from({ length: count }, (_, i) => ({
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    size: 6 + Math.random() * 8,
    xDrift: (Math.random() - 0.5) * 200,
    duration: 2.5 + Math.random(),
    isCircle: Math.random() > 0.5,
  }));
}

function ConfettiPiece({ data }: { data: ReturnType<typeof generateConfettiData>[0] }) {
  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
      animate={{ y: 600, x: data.xDrift, opacity: 0, rotate: 720 }}
      transition={{ duration: data.duration, delay: data.delay, ease: "easeIn" }}
      className="absolute pointer-events-none"
      style={{
        left: `${data.left}%`,
        top: -10,
        width: data.size,
        height: data.size,
        backgroundColor: data.color,
        borderRadius: data.isCircle ? "50%" : "2px",
      }}
    />
  );
}

function FloatingHearts() {
  const hearts = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 16,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.15,
    })),
  []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ y: "110vh", x: `${h.left}vw`, scale: 0, opacity: 0 }}
          animate={{ y: "-10vh", scale: 1, opacity: [0, h.opacity, h.opacity, 0] }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute text-pink-400"
        >
          <Heart className="fill-current" style={{ width: h.size, height: h.size }} />
        </motion.div>
      ))}
    </div>
  );
}

function FloatingCardPreview() {
  return (
    <div className="relative">
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [-2, 1, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-56 md:w-64"
      >
        <div className="absolute -inset-4 bg-gradient-to-br from-pink-400/20 via-rose-300/10 to-violet-400/20 rounded-2xl blur-xl animate-pulse-glow" />
        <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20" style={{ aspectRatio: "3/4" }}>
          <img
            src="/images/bg-romantic-roses.png"
            alt="Card preview"
            className="w-full h-full object-cover"
            data-testid="img-hero-card-preview"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <p className="font-handwritten text-white text-xl md:text-2xl drop-shadow-lg leading-relaxed" data-testid="text-hero-card-message">
              You make every
              <br />
              day brighter
            </p>
            <div className="mt-3 w-12 h-px bg-white/60" />
            <p className="font-handwritten text-white/80 text-sm mt-2 drop-shadow">
              With love
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [-5, 15, -5], x: [0, 8, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -top-8 -right-6 w-40 md:w-48 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10 opacity-60"
        style={{ aspectRatio: "3/4" }}
      >
        <img src="/images/bg-lavender-dream.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-handwritten text-white/90 text-sm drop-shadow">Happy Birthday</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [5, -10, 5], x: [0, -6, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-6 -left-8 w-36 md:w-40 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10 opacity-50"
        style={{ aspectRatio: "3/4" }}
      >
        <img src="/images/bg-cherry-blossom.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-handwritten text-white/90 text-sm drop-shadow">Thank You</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-3 -right-3 text-amber-400 z-10"
      >
        <Sparkles className="w-6 h-6" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.7 }}
        className="absolute -bottom-2 -left-2 text-pink-400 z-10"
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1.2 }}
        className="absolute top-1/2 -right-10 text-violet-400 z-10"
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>
    </div>
  );
}

function getAdaptiveTextClass(messageLength: number) {
  if (messageLength > 600) return "text-xs leading-snug";
  if (messageLength > 400) return "text-sm leading-snug";
  if (messageLength > 200) return "text-base leading-relaxed";
  return "text-lg leading-relaxed";
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [tone, setTone] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [message, setMessage] = useState("");
  const [generatedArtUrl, setGeneratedArtUrl] = useState<string | null>(null);
  const [backgroundTheme, setBackgroundTheme] = useState("romantic-roses");
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(DEFAULT_CANVAS);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  const confettiData = useMemo(() => generateConfettiData(50), [showConfetti]);

  const activeBackgroundImage = customBgImage || (BACKGROUNDS.find((b) => b.id === backgroundTheme) || BACKGROUNDS[0]).image;

  const creditsQuery = useQuery<{
    creditsUsed: number;
    creditsRemaining: number;
    creditLimit: number;
    costs: { textGeneration: number; imageGeneration: number; videoGeneration: number };
  }>({
    queryKey: ["/api/credits"],
  });

  const credits = creditsQuery.data;

  const handleCreditError = (error: unknown) => {
    const err = error as { message?: string };
    if (err?.message?.includes("429") || err?.message?.includes("Credit limit")) {
      toast({
        title: "Credits used up",
        description: "You've used all your free credits for this session. Come back tomorrow for more!",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      return true;
    }
    return false;
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cards/generate", {
        occasion,
        recipientName,
        senderName,
        tone,
        customNote,
      });
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      setMessage(data.message);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    },
    onError: (error) => {
      if (!handleCreditError(error)) {
        toast({
          title: "Oops!",
          description: "Couldn't generate your message. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cards/generate", {
        occasion,
        recipientName,
        senderName,
        tone,
        customNote,
      });
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      setMessage(data.message);
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    },
    onError: (error) => {
      handleCreditError(error);
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cards/generate-image", {
        customNote,
        occasion,
      });
      return res.json();
    },
    onSuccess: (data: { imageUrl: string }) => {
      setGeneratedArtUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    },
    onError: (error) => {
      if (!handleCreditError(error)) {
        toast({
          title: "Art generation note",
          description: "Couldn't generate the art image. You can try again from the preview.",
        });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cards", {
        occasion,
        recipientName,
        senderName,
        tone,
        message,
        backgroundTheme: customBgImage ? "custom" : backgroundTheme,
        customNote,
      });
      return res.json();
    },
    onSuccess: () => {
      setStep(4);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    },
  });

  const handleNext = useCallback(() => {
    if (step === 1 && !occasion) {
      toast({ title: "Please select an occasion", variant: "destructive" });
      return;
    }
    if (step === 2) {
      if (!recipientName.trim() || !senderName.trim() || !tone || !customNote.trim()) {
        toast({ title: "Please fill in all fields", variant: "destructive" });
        return;
      }
      generateMutation.mutate();
      generateImageMutation.mutate();
      return;
    }
    setStep((s) => s + 1);
  }, [step, occasion, recipientName, senderName, tone, customNote, generateMutation, toast]);

  const resetWizard = () => {
    setStep(0);
    setOccasion("");
    setRecipientName("");
    setSenderName("");
    setTone("");
    setCustomNote("");
    setMessage("");
    setGeneratedArtUrl(null);
    setBackgroundTheme("romantic-roses");
    setCustomBgImage(null);
    setCanvasSettings(DEFAULT_CANVAS);
    setShowConfetti(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.filter = `brightness(${canvasSettings.brightness}%) blur(${canvasSettings.blur}px)`;
      ctx.globalAlpha = canvasSettings.opacity / 100;
      ctx.drawImage(img, 0, 0, 600, 800);
      ctx.filter = "none";
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, 600, 800);

      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      const fontSize = message.length > 600 ? 16 : message.length > 400 ? 18 : message.length > 200 ? 20 : 24;
      ctx.font = `${fontSize}px 'Architects Daughter', cursive`;

      const maxWidth = 500;
      const words = message.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize + 8;
      const totalTextHeight = lines.length * lineHeight;
      const startY = Math.max(60, (800 - totalTextHeight) / 2);

      lines.forEach((line, i) => {
        ctx.fillText(line, 300, startY + i * lineHeight);
      });

      ctx.font = `${Math.max(14, fontSize - 4)}px 'Architects Daughter', cursive`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(`- ${senderName}`, 300, startY + lines.length * lineHeight + 24);

      const link = document.createElement("a");
      link.download = `greeting-card-${occasion}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = activeBackgroundImage;
  };

  const handleDownloadArt = () => {
    if (!generatedArtUrl) return;
    const link = document.createElement("a");
    link.download = `greeting-art-${occasion}.png`;
    link.href = generatedArtUrl;
    link.target = "_blank";
    link.click();
  };

  const handleUploadBg = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCustomBgImage(result);
      setBackgroundTheme("custom");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-bl from-violet-200/20 to-transparent rounded-full blur-3xl translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-t from-amber-100/20 to-transparent rounded-full blur-3xl translate-y-1/2" />
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiData.map((data, i) => (
            <ConfettiPiece key={i} data={data} />
          ))}
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between gap-2 px-4 md:px-8 py-4 border-b border-border/50 backdrop-blur-sm bg-background/80" data-testid="header-nav">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="font-serif text-lg font-semibold tracking-tight" data-testid="text-logo">Heartfelt</span>
        </div>
        {step > 0 && step < 4 && (
          <div className="flex items-center gap-1.5" data-testid="progress-steps">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s <= step ? "w-8 bg-primary" : "w-4 bg-muted"
                }`}
                data-testid={`progress-step-${s}`}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          {credits && (
            <Badge
              variant={credits.creditsRemaining <= 2 ? "destructive" : "secondary"}
              className="text-xs"
              data-testid="badge-credits"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {credits.creditsRemaining}/{credits.creditLimit} credits
            </Badge>
          )}
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={resetWizard} data-testid="button-start-over">
              Start Over
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <FloatingHearts />
              <HeroSection onStart={() => setStep(1)} />
              <HowItWorksSection />
              <CardShowcaseSection onStart={() => setStep(1)} />
              <TestimonialsSection />
              <CtaBanner onStart={() => setStep(1)} />
              <LandingFooter />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto px-4 py-8 md:py-12"
            >
              <StepHeader
                number={1}
                title="What's the occasion?"
                subtitle="Choose the perfect moment to celebrate"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-8">
                {OCCASIONS.map((occ) => (
                  <OccasionCard
                    key={occ.id}
                    occasion={occ}
                    selected={occasion === occ.id}
                    onSelect={() => setOccasion(occ.id)}
                  />
                ))}
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={handleNext} disabled={!occasion} data-testid="button-next-step1">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto px-4 py-8 md:py-12"
            >
              <StepHeader
                number={2}
                title="Make it personal"
                subtitle="Tell us a bit so the AI can craft something special"
              />
              <PersonalizationForm
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                senderName={senderName}
                setSenderName={setSenderName}
                tone={tone}
                setTone={setTone}
                customNote={customNote}
                setCustomNote={setCustomNote}
              />
              <div className="flex items-center justify-between gap-2 mt-8">
                <Button variant="ghost" onClick={() => setStep(1)} data-testid="button-back-step2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!recipientName.trim() || !senderName.trim() || !tone || !customNote.trim() || generateMutation.isPending}
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Crafting your message...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Card
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="max-w-6xl mx-auto px-4 py-8 md:py-12"
            >
              <StepHeader
                number={3}
                title="Your card is ready"
                subtitle="Edit the message, customize your background, and make it perfect"
              />
              <PreviewStudio
                message={message}
                setMessage={setMessage}
                backgroundTheme={backgroundTheme}
                setBackgroundTheme={(id) => {
                  setBackgroundTheme(id);
                  setCustomBgImage(null);
                }}
                senderName={senderName}
                onRegenerate={() => regenerateMutation.mutate()}
                isRegenerating={regenerateMutation.isPending}
                activeBackgroundImage={activeBackgroundImage}
                customBgImage={customBgImage}
                onUploadBg={handleUploadBg}
                canvasSettings={canvasSettings}
                setCanvasSettings={setCanvasSettings}
                generatedArtUrl={generatedArtUrl}
                isGeneratingArt={generateImageMutation.isPending}
                onRegenerateArt={() => generateImageMutation.mutate()}
              />
              <div className="flex items-center justify-between gap-2 mt-8">
                <Button variant="ghost" onClick={() => setStep(2)} data-testid="button-back-step3">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-card">
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Finish & Export
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto px-4 py-8 md:py-12 text-center"
            >
              <ExportScreen
                message={message}
                senderName={senderName}
                backgroundImage={activeBackgroundImage}
                canvasSettings={canvasSettings}
                onDownload={handleDownload}
                onDownloadArt={handleDownloadArt}
                onCopy={handleCopy}
                onCreateNew={resetWizard}
                generatedArtUrl={generatedArtUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ScrollReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const WORKFLOW_STEPS = [
  {
    icon: Heart,
    title: "Choose the Occasion",
    description: "Birthday, Valentine's, anniversary, or just because - pick the perfect moment.",
    color: "from-pink-500 to-rose-400",
    iconBg: "bg-pink-50 dark:bg-pink-950/30",
    iconColor: "text-pink-500",
  },
  {
    icon: MessageCircleHeart,
    title: "Tell Us About Them",
    description: "Share details about your loved one so the AI can make it truly personal.",
    color: "from-violet-500 to-purple-400",
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-500",
  },
  {
    icon: Paintbrush,
    title: "AI Creates the Magic",
    description: "Get a personalized message, custom AI art, and a themed card - all generated for you.",
    color: "from-amber-500 to-orange-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
  },
  {
    icon: Send,
    title: "Send an Animated Video",
    description: "Transform your card into a magical animated video and share it with someone special.",
    color: "from-emerald-500 to-teal-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-500",
  },
];

const TESTIMONIALS = [
  {
    quote: "I sent my mom a birthday card and she literally cried. The AI knew exactly what to say.",
    author: "Sarah K.",
    occasion: "Birthday",
  },
  {
    quote: "Way better than any card I could buy at the store. It felt so personal and unique.",
    author: "David M.",
    occasion: "Anniversary",
  },
  {
    quote: "The animated video card blew my girlfriend away. She watched it like ten times.",
    author: "James R.",
    occasion: "Valentine's Day",
  },
  {
    quote: "I'm not a words person, but this app made me sound like a poet. My wife loved it.",
    author: "Michael T.",
    occasion: "Just Because",
  },
];

const SHOWCASE_CARDS = [
  { bg: "/images/bg-romantic-roses.png", label: "Romantic Roses", text: "Every love story is beautiful, but ours is my favorite" },
  { bg: "/images/bg-lavender-dream.png", label: "Lavender Dream", text: "You paint my world in colors I never knew existed" },
  { bg: "/images/bg-golden-elegance.png", label: "Golden Elegance", text: "Here's to another year of your incredible light" },
  { bg: "/images/bg-cherry-blossom.png", label: "Cherry Blossom", text: "Like cherry blossoms, our love renews each season" },
  { bg: "/images/bg-sunset-warmth.png", label: "Sunset Warmth", text: "Thank you for being my sunshine on cloudy days" },
  { bg: "/images/bg-birthday-joy.png", label: "Birthday Joy", text: "May this year bring you everything your heart desires" },
];

function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 px-4 md:px-8 py-16 md:py-24 min-h-[85vh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-300/20 to-rose-200/10 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-300/15 to-purple-200/10 rounded-full blur-3xl animate-drift" style={{ animationDelay: "4s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-pink-200/10 to-transparent rounded-full animate-pulse-glow" />
      </div>

      <div className="flex-1 max-w-xl text-center lg:text-left relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge variant="secondary" className="mb-5 font-sans text-xs tracking-wider px-3 py-1" data-testid="badge-ai-powered">
              <Wand2 className="w-3 h-3 mr-1.5" /> AI-Powered Magic
            </Badge>
          </motion.div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-foreground" data-testid="text-hero-headline">
            Words and art that
            <br />
            come alive to make
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-violet-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                hearts flutter
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-violet-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ transformOrigin: "left" }}
              />
            </span>
          </h1>
          <p className="mt-5 md:mt-7 text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0" data-testid="text-hero-subtitle">
            Create personalized greeting cards with AI-generated art, heartfelt messages, and magical animated videos. Every card is as unique as your love.
          </p>
          <div className="mt-7 md:mt-9 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button size="lg" onClick={onStart} className="animate-glow-pulse" data-testid="button-create-card">
                <Heart className="w-4 h-4 fill-current" /> Create Your Card
              </Button>
            </motion.div>
            <Button variant="outline" size="lg" onClick={onStart} className="backdrop-blur-sm" data-testid="button-see-how">
              See How It Works <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/70" data-testid="text-free-notice">
            Free to create. No sign-up needed.
          </p>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: 30 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex-shrink-0 relative z-10"
      >
        <FloatingCardPreview />
      </motion.div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/30 dark:via-pink-950/10 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        <ScrollReveal className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 font-sans text-xs tracking-wider" data-testid="badge-how-it-works">
            <Sparkles className="w-3 h-3 mr-1.5" /> Simple & Magical
          </Badge>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" data-testid="text-how-it-works-title">
            Four steps to something{" "}
            <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">unforgettable</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-base md:text-lg" data-testid="text-how-it-works-subtitle">
            From idea to animated video card in minutes. No design skills needed.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={i} delay={i * 0.15}>
                <Card className="p-6 md:p-8 group" data-testid={`card-workflow-step-${i + 1}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl ${step.iconBg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${step.iconColor}`} />
                        </div>
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                          {i + 1}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-1.5" data-testid={`text-workflow-title-${i + 1}`}>{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-workflow-desc-${i + 1}`}>{step.description}</p>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CardShowcaseSection({ onStart }: { onStart: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const next = direction === "left"
      ? Math.max(0, activeIndex - 1)
      : Math.min(SHOWCASE_CARDS.length - 1, activeIndex + 1);
    setActiveIndex(next);
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.children[0]?.clientWidth || 260;
      scrollRef.current.scrollTo({ left: next * (cardWidth + 16), behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 font-sans text-xs tracking-wider" data-testid="badge-showcase">
            <Paintbrush className="w-3 h-3 mr-1.5" /> Beautiful Themes
          </Badge>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" data-testid="text-showcase-title">
            Cards that take their{" "}
            <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">breath away</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-base md:text-lg" data-testid="text-showcase-subtitle">
            Choose from stunning themed backgrounds, each designed to set the perfect mood.
          </p>
        </ScrollReveal>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {SHOWCASE_CARDS.map((card, i) => (
              <ScrollReveal key={i} delay={i * 0.1} className="flex-shrink-0 snap-center">
                <motion.div
                  className="relative w-56 md:w-64 rounded-xl overflow-hidden shadow-lg group cursor-pointer"
                  style={{ aspectRatio: "3/4" }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ duration: 0.3 }}
                  data-testid={`card-showcase-${i}`}
                >
                  <img src={card.bg} alt={card.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/50" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-pink-400/50 rounded-xl pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <p className="font-handwritten text-white text-sm md:text-base drop-shadow-lg leading-relaxed">{card.text}</p>
                    <p className="text-white/60 text-xs mt-2 font-sans">{card.label}</p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" size="icon" onClick={() => scroll("left")} disabled={activeIndex === 0} data-testid="button-showcase-prev">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1.5">
              {SHOWCASE_CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); scrollRef.current?.scrollTo({ left: i * 276, behavior: "smooth" }); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-primary" : "bg-muted-foreground/30"}`}
                  data-testid={`dot-showcase-${i}`}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={() => scroll("right")} disabled={activeIndex === SHOWCASE_CARDS.length - 1} data-testid="button-showcase-next">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollReveal className="text-center mt-10">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button size="lg" onClick={onStart} className="animate-glow-pulse" data-testid="button-create-card-showcase">
              <Sparkles className="w-4 h-4" /> Start Creating
            </Button>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/20 dark:via-violet-950/10 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        <ScrollReveal className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 font-sans text-xs tracking-wider" data-testid="badge-testimonials">
            <Heart className="w-3 h-3 mr-1.5 fill-current text-pink-500" /> Love Letters
          </Badge>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" data-testid="text-testimonials-title">
            People are{" "}
            <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">falling in love</span>
            {" "}with it
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={i} delay={i * 0.12}>
              <Card className="relative p-6" data-testid={`card-testimonial-${i}`}>
                <Quote className="w-8 h-8 text-pink-300/40 dark:text-pink-400/20 absolute top-4 right-4" />
                <p className="font-handwritten text-foreground/80 text-base md:text-lg leading-relaxed mb-4 relative z-10" data-testid={`text-testimonial-quote-${i}`}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid={`text-testimonial-author-${i}`}>{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.occasion}</p>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative py-20 md:py-28 px-4 md:px-8">
      <ScrollReveal>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-pink-100/50 via-rose-50/30 to-violet-100/50 dark:from-pink-950/20 dark:via-rose-950/10 dark:to-violet-950/20 rounded-3xl blur-sm" />
          <Card className="relative p-10 md:p-14" data-testid="card-cta-banner">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Heart className="w-10 h-10 text-pink-400 fill-current mx-auto mb-5" />
            </motion.div>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="text-cta-title">
              Ready to make someone's day?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto" data-testid="text-cta-subtitle">
              Create a one-of-a-kind greeting card with AI-generated art, a heartfelt message, and an animated video - all in minutes.
            </p>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button size="lg" onClick={onStart} className="animate-glow-pulse" data-testid="button-create-card-cta">
                <Heart className="w-4 h-4 fill-current" /> Create Your Card Now
              </Button>
            </motion.div>
            <p className="mt-4 text-xs text-muted-foreground/60">No account required. Completely free.</p>
          </Card>
        </div>
      </ScrollReveal>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="relative py-12 px-4 md:px-8 border-t border-border/30">
      <div className="absolute inset-0 bg-gradient-to-t from-pink-50/30 dark:from-pink-950/10 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <span className="font-serif text-lg font-semibold tracking-tight" data-testid="text-footer-logo">Heartfelt</span>
          </div>
          <p className="text-sm text-muted-foreground/60 text-center" data-testid="text-footer-tagline">
            Made with love. Powered by AI.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/40">Crafted for those who care enough to send the very best.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function StepHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-2">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3" data-testid={`badge-step-${number}`}>
        {number}
      </span>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground" data-testid={`text-step${number}-title`}>
        {title}
      </h2>
      <p className="text-muted-foreground mt-1.5 text-sm md:text-base" data-testid={`text-step${number}-subtitle`}>{subtitle}</p>
    </div>
  );
}

function OccasionCard({
  occasion,
  selected,
  onSelect,
}: {
  occasion: typeof OCCASIONS[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = occasion.icon;

  return (
    <Card
      className={`relative p-4 md:p-6 text-center cursor-pointer transition-all duration-300 hover-elevate ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : ""
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(); }}
      data-testid={`button-occasion-${occasion.id}`}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${occasion.color} opacity-60 pointer-events-none`} />
      <div className="relative">
        <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/80 ${occasion.iconColor} mb-3`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <p className="font-medium text-sm md:text-base text-foreground" data-testid={`text-occasion-label-${occasion.id}`}>{occasion.label}</p>
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
        >
          <Check className="w-3 h-3" />
        </motion.div>
      )}
    </Card>
  );
}

function PersonalizationForm({
  recipientName,
  setRecipientName,
  senderName,
  setSenderName,
  tone,
  setTone,
  customNote,
  setCustomNote,
}: {
  recipientName: string;
  setRecipientName: (v: string) => void;
  senderName: string;
  setSenderName: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  customNote: string;
  setCustomNote: (v: string) => void;
}) {
  return (
    <div className="space-y-5 mt-8">
      <Card className="p-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block" htmlFor="recipientName">
              Who is this card for?
            </label>
            <Input
              id="recipientName"
              placeholder="e.g. Sarah, Mom, My Love..."
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              data-testid="input-recipient-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block" htmlFor="senderName">
              From
            </label>
            <Input
              id="senderName"
              placeholder="Your name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              data-testid="input-sender-name"
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <label className="text-sm font-medium text-foreground mb-3 block">
          What tone fits best?
        </label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => {
            const Icon = t.icon;
            const isSelected = tone === t.id;
            return (
              <Button
                key={t.id}
                variant={isSelected ? "default" : "secondary"}
                size="sm"
                onClick={() => setTone(t.id)}
                data-testid={`button-tone-${t.id}`}
                className="rounded-full"
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <label className="text-sm font-medium text-foreground mb-1.5 block" htmlFor="customNote">
          Things the recipient would love to see in art. This helps me generate meaningful art.
        </label>
        <Textarea
          id="customNote"
          placeholder="e.g. We met through running club, and she likes Bad Bunny, the musician."
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          rows={3}
          className="resize-none"
          data-testid="input-custom-note"
        />
      </Card>
    </div>
  );
}

function PreviewStudio({
  message,
  setMessage,
  backgroundTheme,
  setBackgroundTheme,
  senderName,
  onRegenerate,
  isRegenerating,
  activeBackgroundImage,
  customBgImage,
  onUploadBg,
  canvasSettings,
  setCanvasSettings,
  generatedArtUrl,
  isGeneratingArt,
  onRegenerateArt,
}: {
  message: string;
  setMessage: (v: string) => void;
  backgroundTheme: string;
  setBackgroundTheme: (v: string) => void;
  senderName: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
  activeBackgroundImage: string;
  customBgImage: string | null;
  onUploadBg: (file: File) => void;
  canvasSettings: CanvasSettings;
  setCanvasSettings: (s: CanvasSettings) => void;
  generatedArtUrl: string | null;
  isGeneratingArt: boolean;
  onRegenerateArt: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return;
      }
      onUploadBg(file);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <label className="text-sm font-medium text-foreground" data-testid="text-message-label">Your Message</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
                data-testid="button-regenerate"
              >
                {isRegenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Regenerate
              </Button>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none font-handwritten text-base leading-relaxed"
              data-testid="textarea-message"
            />
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-foreground" data-testid="text-canvas-label">Canvas Settings</label>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Opacity</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground" data-testid="text-opacity-value">{canvasSettings.opacity}%</span>
                </div>
                <Slider
                  value={[canvasSettings.opacity]}
                  onValueChange={([v]) => setCanvasSettings({ ...canvasSettings, opacity: v })}
                  min={30}
                  max={100}
                  step={1}
                  data-testid="slider-opacity"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Blur</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground" data-testid="text-blur-value">{canvasSettings.blur}px</span>
                </div>
                <Slider
                  value={[canvasSettings.blur]}
                  onValueChange={([v]) => setCanvasSettings({ ...canvasSettings, blur: v })}
                  min={0}
                  max={20}
                  step={1}
                  data-testid="slider-blur"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <SunDim className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Brightness</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground" data-testid="text-brightness-value">{canvasSettings.brightness}%</span>
                </div>
                <Slider
                  value={[canvasSettings.brightness]}
                  onValueChange={([v]) => setCanvasSettings({ ...canvasSettings, brightness: v })}
                  min={30}
                  max={150}
                  step={1}
                  data-testid="slider-brightness"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-6" data-testid="card-preview-container">
          <CardPreview
            message={message}
            backgroundImage={activeBackgroundImage}
            senderName={senderName}
            canvasSettings={canvasSettings}
          />

          <Card className="w-full max-w-xs p-4">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground" data-testid="text-ai-art-label">AI-Generated Art</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerateArt}
                disabled={isGeneratingArt}
                data-testid="button-regenerate-art"
              >
                {isGeneratingArt ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Regenerate
              </Button>
            </div>
            <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: "3/4" }}>
              {isGeneratingArt && !generatedArtUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground" data-testid="text-art-generating">Creating your art...</p>
                </div>
              ) : generatedArtUrl ? (
                <div className="relative">
                  <img
                    src={generatedArtUrl}
                    alt="AI-generated art for your card"
                    className="w-full h-full object-cover rounded-lg"
                    data-testid="img-generated-art"
                  />
                  {isGeneratingArt && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground" data-testid="text-art-placeholder">Art will appear here</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <label className="text-sm font-medium text-foreground" data-testid="text-bg-label">Choose a background</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-upload-bg"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-bg"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Your Own
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {customBgImage && (
            <Button
              variant="ghost"
              onClick={() => {
                setBackgroundTheme("custom");
              }}
              data-testid="button-bg-custom"
              className={`flex-shrink-0 p-0 h-auto rounded-lg overflow-visible border-2 no-default-hover-elevate no-default-active-elevate ${
                backgroundTheme === "custom" ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              }`}
            >
              <div className="relative w-16 h-20 md:w-20 md:h-24 rounded-md overflow-hidden">
                <img src={customBgImage} alt="Your upload" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] text-center py-0.5">
                  Yours
                </div>
              </div>
            </Button>
          )}
          {BACKGROUNDS.map((bg) => (
            <Button
              key={bg.id}
              variant="ghost"
              onClick={() => setBackgroundTheme(bg.id)}
              data-testid={`button-bg-${bg.id}`}
              className={`flex-shrink-0 p-0 h-auto rounded-lg overflow-visible border-2 no-default-hover-elevate no-default-active-elevate ${
                backgroundTheme === bg.id && !customBgImage ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              }`}
            >
              <img src={bg.image} alt={bg.label} className="w-16 h-20 md:w-20 md:h-24 object-cover rounded-md" />
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CardPreview({
  message,
  backgroundImage,
  senderName,
  canvasSettings,
}: {
  message: string;
  backgroundImage: string;
  senderName: string;
  canvasSettings: CanvasSettings;
}) {
  const textClass = getAdaptiveTextClass(message.length);

  return (
    <motion.div
      layout
      className="relative w-full max-w-xs rounded-xl overflow-hidden shadow-lg"
      style={{ aspectRatio: "3/4" }}
      data-testid="card-preview"
    >
      <img
        src={backgroundImage}
        alt="Card background"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
        style={{
          opacity: canvasSettings.opacity / 100,
          filter: `blur(${canvasSettings.blur}px) brightness(${canvasSettings.brightness}%)`,
        }}
        data-testid="img-card-bg"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/40" />
      <div className="relative h-full flex flex-col items-center justify-center p-4 md:p-5 text-center overflow-y-auto">
        <p
          className={`font-handwritten text-white drop-shadow-lg whitespace-pre-wrap break-words ${textClass}`}
          data-testid="text-card-message"
        >
          {message || "Your message will appear here..."}
        </p>
        {senderName && (
          <>
            <div className="mt-3 w-10 h-px bg-white/50 flex-shrink-0" />
            <p className="mt-1.5 font-handwritten text-white/80 text-sm drop-shadow flex-shrink-0" data-testid="text-card-sender">
              - {senderName}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

function renderCardToBase64(
  message: string,
  backgroundImage: string,
  senderName: string,
  canvasSettings: CanvasSettings,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject("No canvas context");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.filter = `brightness(${canvasSettings.brightness}%) blur(${canvasSettings.blur}px)`;
      ctx.globalAlpha = canvasSettings.opacity / 100;
      ctx.drawImage(img, 0, 0, 600, 800);
      ctx.filter = "none";
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, 600, 800);

      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      const fontSize = message.length > 600 ? 16 : message.length > 400 ? 18 : message.length > 200 ? 20 : 24;
      ctx.font = `${fontSize}px 'Architects Daughter', cursive`;

      const maxWidth = 500;
      const words = message.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize + 8;
      const totalTextHeight = lines.length * lineHeight;
      const startY = Math.max(60, (800 - totalTextHeight) / 2);

      lines.forEach((line, i) => {
        ctx.fillText(line, 300, startY + i * lineHeight);
      });

      ctx.font = `${Math.max(14, fontSize - 4)}px 'Architects Daughter', cursive`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(`- ${senderName}`, 300, startY + lines.length * lineHeight + 24);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject("Failed to load background image");
    img.src = backgroundImage;
  });
}

const VIDEO_PROMPT = `Generate a Valentine-themed animated video to read the card. Animation Style: Gentle zoom-in or parallax effect on the opening art. Floating hearts, sparkles, soft light particles. A smooth page-opening or unfolding card animation. Subtle camera movement to create emotional depth. Elegant text reveal animation as if the message is being written or revealed line by line. Tone and Aesthetic: Romantic, Festive, Warm, Cinematic but soft, Magical and heartfelt. Smooth transitions with no abrupt cuts. Maintain visual consistency between the AI art and the card design.`;

function ExportScreen({
  message,
  senderName,
  backgroundImage,
  canvasSettings,
  onDownload,
  onDownloadArt,
  onCopy,
  onCreateNew,
  generatedArtUrl,
}: {
  message: string;
  senderName: string;
  backgroundImage: string;
  canvasSettings: CanvasSettings;
  onDownload: () => void;
  onDownloadArt: () => void;
  onCopy: () => void;
  onCreateNew: () => void;
  generatedArtUrl: string | null;
}) {
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<"idle" | "submitting" | "processing" | "completed" | "failed">("idle");
  const [videoError, setVideoError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoTaskId || videoStatus === "completed" || videoStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cards/video-status/${videoTaskId}`);
        if (!res.ok) throw new Error("Status check failed");
        const data = await res.json();

        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoStatus("completed");
          clearInterval(interval);
        } else if (data.status === "failed") {
          setVideoStatus("failed");
          setVideoError(data.error || "Video generation failed");
          clearInterval(interval);
        }
      } catch {
        // silently retry on network errors
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [videoTaskId, videoStatus]);

  const handleGenerateVideo = async () => {
    if (!generatedArtUrl) {
      toast({ title: "AI art is required to generate a video", variant: "destructive" });
      return;
    }

    setVideoStatus("submitting");
    setVideoError(null);

    try {
      const lastFrameBase64 = await renderCardToBase64(message, backgroundImage, senderName, canvasSettings);

      const res = await apiRequest("POST", "/api/cards/generate-video", {
        firstFrameImageUrl: generatedArtUrl,
        lastFrameImageBase64: lastFrameBase64,
        prompt: VIDEO_PROMPT,
      });

      const data = await res.json();

      if (data.taskId) {
        setVideoTaskId(data.taskId);
        setVideoStatus("processing");
      } else {
        setVideoStatus("failed");
        setVideoError("No task ID received");
      }
    } catch (error) {
      const err = error as { message?: string };
      if (err?.message?.includes("429") || err?.message?.includes("Credit limit")) {
        toast({
          title: "Credits used up",
          description: "You've used all your free credits for this session. Come back tomorrow for more!",
          variant: "destructive",
        });
        setVideoStatus("idle");
      } else {
        setVideoStatus("failed");
        setVideoError("Failed to start video generation");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.download = "greeting-card-video.mp4";
    link.href = videoUrl;
    link.target = "_blank";
    link.click();
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground" data-testid="text-export-title">
          Your card is complete!
        </h2>
        <p className="text-muted-foreground mt-2 mb-8" data-testid="text-export-subtitle">Share it with someone special</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8"
      >
        <div className="text-center">
          <CardPreview
            message={message}
            backgroundImage={backgroundImage}
            senderName={senderName}
            canvasSettings={canvasSettings}
          />
          <p className="text-xs text-muted-foreground mt-2">Text Card</p>
        </div>
        {generatedArtUrl && (
          <div className="text-center">
            <div className="relative w-full max-w-xs rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: "3/4" }}>
              <img
                src={generatedArtUrl}
                alt="AI-generated art"
                className="w-full h-full object-cover"
                data-testid="img-export-art"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">AI Art</p>
          </div>
        )}
      </motion.div>

      {generatedArtUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Card className="max-w-lg mx-auto p-5">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold text-foreground" data-testid="text-video-section-title">Animated Video Card</h3>
            </div>

            {videoStatus === "idle" && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-video-description">
                  Transform your card into a magical animated video with floating hearts, sparkles, and an elegant reveal.
                </p>
                <Button onClick={handleGenerateVideo} data-testid="button-generate-video">
                  <Play className="w-4 h-4" /> Generate Video
                </Button>
              </div>
            )}

            {(videoStatus === "submitting" || videoStatus === "processing") && (
              <div className="text-center py-6">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground" data-testid="text-video-processing">
                  {videoStatus === "submitting" ? "Starting video creation..." : "Creating your animated video..."}
                </p>
                <p className="text-xs text-muted-foreground mt-2" data-testid="text-video-wait">
                  This takes about 4-5 minutes. Feel free to wait here.
                </p>
                <div className="mt-4 flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  ))}
                </div>
              </div>
            )}

            {videoStatus === "completed" && videoUrl && (
              <div className="text-center">
                <div className="rounded-lg overflow-hidden shadow-md mb-4">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full"
                    data-testid="video-player"
                  />
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button onClick={handleDownloadVideo} data-testid="button-download-video">
                    <Download className="w-4 h-4" /> Download Video
                  </Button>
                  <Button variant="outline" onClick={handleGenerateVideo} data-testid="button-regenerate-video">
                    <RotateCcw className="w-4 h-4" /> Regenerate
                  </Button>
                </div>
              </div>
            )}

            {videoStatus === "failed" && (
              <div className="text-center py-4">
                <p className="text-sm text-destructive mb-3" data-testid="text-video-error">
                  {videoError || "Video generation failed. Please try again."}
                </p>
                <Button variant="outline" onClick={handleGenerateVideo} data-testid="button-retry-video">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap"
      >
        <Button onClick={onDownload} data-testid="button-download">
          <Download className="w-4 h-4" /> Download Card
        </Button>
        {generatedArtUrl && (
          <Button variant="outline" onClick={onDownloadArt} data-testid="button-download-art">
            <Download className="w-4 h-4" /> Download Art
          </Button>
        )}
        <Button variant="outline" onClick={onCopy} data-testid="button-copy">
          <Copy className="w-4 h-4" /> Copy Message
        </Button>
        <Button variant="secondary" onClick={onCreateNew} data-testid="button-create-new">
          <Sparkles className="w-4 h-4" /> Create Another
        </Button>
      </motion.div>
    </div>
  );
}
