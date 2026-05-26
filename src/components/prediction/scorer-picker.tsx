"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, X, Search } from "lucide-react";
import type { Player, Team } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface ScorerPickerProps {
  players: Player[];
  homeTeam: Team | null;
  awayTeam: Team | null;
  selectedPlayerIds: string[];
  onTogglePlayer: (playerId: string) => void;
  disabled?: boolean;
}

const POSITION_LABELS: Record<string, string> = {
  GK: "GOL",
  DF: "DEF",
  MF: "MEI",
  FW: "ATA",
};

const POSITION_ORDER: Record<string, number> = {
  FW: 0,
  MF: 1,
  DF: 2,
  GK: 3,
};

export function ScorerPicker({
  players,
  homeTeam,
  awayTeam,
  selectedPlayerIds,
  onTogglePlayer,
  disabled = false,
}: ScorerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPlayers = players
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const posA = POSITION_ORDER[a.position ?? "GK"] ?? 3;
      const posB = POSITION_ORDER[b.position ?? "GK"] ?? 3;
      return posA - posB;
    });

  const homePlayers = filteredPlayers.filter(
    (p) => p.team_id === homeTeam?.id
  );
  const awayPlayers = filteredPlayers.filter(
    (p) => p.team_id === awayTeam?.id
  );

  const selectedPlayers = players.filter((p) =>
    selectedPlayerIds.includes(p.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Quem vai marcar gol?
        </label>
        <span className="text-[10px] text-muted-foreground">
          +2 pts por acerto
        </span>
      </div>

      {/* Selected players */}
      {selectedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPlayers.map((player) => (
            <Badge
              key={player.id}
              variant="secondary"
              className="gap-1 pr-1 bg-primary/10 text-primary"
            >
              <span className="text-xs">
                {player.name}
                {player.shirt_number && ` #${player.shirt_number}`}
              </span>
              <button
                type="button"
                onClick={() => onTogglePlayer(player.id)}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed"
              disabled={disabled}
            />
          }
        >
          <UserPlus className="h-4 w-4" />
          {selectedPlayerIds.length > 0
            ? "Adicionar outro jogador"
            : "Selecionar artilheiro"}
        </DialogTrigger>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Selecionar Artilheiro</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jogador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="max-h-80">
            <div className="px-4 pb-4 space-y-4">
              {/* Home team players */}
              {homeTeam && homePlayers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {homeTeam.name}
                  </h4>
                  <div className="space-y-1">
                    {homePlayers.map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        isSelected={selectedPlayerIds.includes(player.id)}
                        onToggle={() => onTogglePlayer(player.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Away team players */}
              {awayTeam && awayPlayers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {awayTeam.name}
                  </h4>
                  <div className="space-y-1">
                    {awayPlayers.map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        isSelected={selectedPlayerIds.includes(player.id)}
                        onToggle={() => onTogglePlayer(player.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {homePlayers.length === 0 && awayPlayers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {search
                    ? "Nenhum jogador encontrado"
                    : "Elencos ainda nao disponiveis"}
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlayerRow({
  player,
  isSelected,
  onToggle,
}: {
  player: Player;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted"
      )}
    >
      {player.shirt_number && (
        <span className="text-xs font-bold w-6 text-center text-muted-foreground">
          {player.shirt_number}
        </span>
      )}
      <span className="flex-1 text-sm font-medium">{player.name}</span>
      {player.position && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {POSITION_LABELS[player.position] ?? player.position}
        </Badge>
      )}
      {isSelected && (
        <span className="text-xs font-bold text-primary">✓</span>
      )}
    </button>
  );
}
