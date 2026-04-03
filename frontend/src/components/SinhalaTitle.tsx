import { Noto_Sans_Sinhala } from "next/font/google";

const notoSansSinhala = Noto_Sans_Sinhala({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["sinhala"],
  display: "swap",
});

type SinhalaTitleProps = {
  text?: string;
  className?: string;
};

export default function SinhalaTitle({ text = "කුප්පි", className = "" }: SinhalaTitleProps) {
  return (
    <span
      lang="si"
      dir="ltr"
      className={[
        notoSansSinhala.className,
        "inline-flex items-center gap-2 rounded-full border border-slate-200/80",
        "bg-white/90 px-4 py-2 text-sm font-semibold tracking-normal text-slate-900",
        "shadow-[0_10px_30px_-16px_rgba(15,23,42,0.35)] backdrop-blur-sm",
        "whitespace-nowrap leading-none antialiased [text-rendering:optimizeLegibility]",
        className,
      ].join(" ")}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
        SI
      </span>
      <span>{text}</span>
    </span>
  );
}