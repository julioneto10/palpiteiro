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
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (!team) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={sizeClasses[size]}>🏳️</span>
        {showName && (
          <span className={cn("font-medium text-muted-foreground", textSizes[size])}>
            A definir
          </span>
        )}
      </div>
    );
  }

  // Map FIFA codes to flag emojis
  const flagEmoji = getFlagEmoji(team.code);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={sizeClasses[size]}>{flagEmoji}</span>
      {showName && (
        <span className={cn("font-medium", textSizes[size])}>
          {team.name}
        </span>
      )}
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codeMap: Record<string, string> = {
    // Common codes
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
    FIN: "🇫🇮", ISL: "🇮🇸", IRL: "🇮🇪", NIR: "🇬🇧", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", // Scotland
    GRE: "🇬🇷", TUR: "🇹🇷", RUS: "🇷🇺", GEO: "🇬🇪", ALB: "🇦🇱",
    BIH: "🇧🇦", MNE: "🇲🇪", MKD: "🇲🇰", KOS: "🇽🇰",
    NZL: "🇳🇿", PNG: "🇵🇬", NCL: "🇳🇨", FIJ: "🇫🇯",
  };

  return codeMap[countryCode] ?? "🏳️";
}
