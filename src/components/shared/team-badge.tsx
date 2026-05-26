import type { Team } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  team: Team | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function TeamBadge({
  team,
  size = "md",
  showName = true,
  className,
}: TeamBadgeProps) {
  const chipClass = {
    sm: "h-9 w-9 text-lg rounded-lg",
    md: "h-11 w-11 text-2xl rounded-xl",
    lg: "h-14 w-14 text-[2rem] rounded-2xl",
  }[size];

  const flagEmoji = team ? getFlagEmoji(team.code) : "🏳️";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center border border-border bg-secondary leading-none",
          chipClass
        )}
      >
        {flagEmoji}
      </span>
      {showName &&
        (team ? (
          <div className="min-w-0 leading-tight">
            <div className="font-heading text-sm font-extrabold tracking-wide">
              {team.code}
            </div>
            <div className="truncate text-[11px] font-medium text-muted-foreground">
              {team.name}
            </div>
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            A definir
          </span>
        ))}
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codeMap: Record<string, string> = {
    BRA: "🇧🇷", ARG: "🇦🇷", FRA: "🇫🇷", GER: "🇩🇪", ESP: "🇪🇸",
    USA: "🇺🇸", MAR: "🇲🇦",
    ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", POR: "🇵🇹", NED: "🇳🇱", BEL: "🇧🇪", CRO: "🇭🇷",
    URU: "🇺🇾", COL: "🇨🇴", MEX: "🇲🇽", JPN: "🇯🇵", KOR: "🇰🇷",
    AUS: "🇦🇺", SEN: "🇸🇳", GHA: "🇬🇭", CMR: "🇨🇲", NGA: "🇳🇬",
    IRN: "🇮🇷", KSA: "🇸🇦", QAT: "🇶🇦", CAN: "🇨🇦", WAL: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    SUI: "🇨🇭", SRB: "🇷🇸", POL: "🇵🇱", DEN: "🇩🇰", TUN: "🇹🇳",
    CRC: "🇨🇷", ECU: "🇪🇨", PAR: "🇵🇾", CHI: "🇨🇱", PER: "🇵🇪",
    BOL: "🇧🇴", VEN: "🇻🇪", HON: "🇭🇳", SLV: "🇸🇻", JAM: "🇯🇲",
    PAN: "🇵🇦", TRI: "🇹🇹", CUW: "🇨🇼", HAI: "🇭🇹",
    EGY: "🇪🇬", ALG: "🇩🇿", RSA: "🇿🇦", CIV: "🇨🇮", MLI: "🇲🇱",
    GUI: "🇬🇳", BFA: "🇧🇫", CPV: "🇨🇻", MOZ: "🇲🇿", ZAM: "🇿🇲",
    TAN: "🇹🇿", COD: "🇨🇩", UGA: "🇺🇬", NAM: "🇳🇦", ZIM: "🇿🇼",
    CHN: "🇨🇳", IND: "🇮🇳", IRQ: "🇮🇶", UZB: "🇺🇿", JOR: "🇯🇴",
    BHR: "🇧🇭", IDN: "🇮🇩", VIE: "🇻🇳", THA: "🇹🇭",
    ITA: "🇮🇹", AUT: "🇦🇹", CZE: "🇨🇿", UKR: "🇺🇦", ROU: "🇷🇴",
    SVK: "🇸🇰", SVN: "🇸🇮", HUN: "🇭🇺", SWE: "🇸🇪", NOR: "🇳🇴",
    FIN: "🇫🇮", ISL: "🇮🇸", IRL: "🇮🇪", NIR: "🇬🇧", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    GRE: "🇬🇷", TUR: "🇹🇷", RUS: "🇷🇺", GEO: "🇬🇪", ALB: "🇦🇱",
    BIH: "🇧🇦", MNE: "🇲🇪", MKD: "🇲🇰", KOS: "🇽🇰",
    NZL: "🇳🇿", PNG: "🇵🇬", NCL: "🇳🇨", FIJ: "🇫🇯",
  };

  return codeMap[countryCode] ?? "🏳️";
}
