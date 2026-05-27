"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGroupSettings, deleteGroup } from "@/lib/actions/groups";
import { DEFAULT_SCORING } from "@/lib/constants/scoring";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Group } from "@/lib/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function BolaoConfigPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadGroup() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      const { data } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (data) setGroup(data as Group);
    }
    loadGroup();
  }, [groupId]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteGroup(groupId);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
      setConfirmOpen(false);
    } else {
      toast.success("Bolao excluido.");
      router.push("/boloes");
    }
  }

  const isOwner = !!group && !!userId && group.owner_id === userId;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await updateGroupSettings(groupId, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Configuracoes atualizadas!");
      router.push(`/boloes/${groupId}`);
    }
    setLoading(false);
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/boloes/${groupId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-heading text-2xl font-black uppercase tracking-tight">
            Configuracoes
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const sc = group.scoring_config as {
    correct_winner?: number;
    exact_score?: number;
    correct_scorer?: number;
  } | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/boloes/${groupId}`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight">Configuracoes</h1>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nome do bolao
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={group.name}
            required
            minLength={3}
            maxLength={50}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Descricao
          </label>
          <Input
            id="description"
            name="description"
            defaultValue={group.description ?? ""}
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="maxMembers" className="text-sm font-medium">
            Maximo de membros
          </label>
          <Input
            id="maxMembers"
            name="maxMembers"
            type="number"
            min={2}
            max={1000}
            defaultValue={group.max_members}
          />
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Pontuacao</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <p className="text-[10px] text-muted-foreground">
              Vale so para este bolao. Ao salvar, o ranking e recalculado.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label
                  htmlFor="scoringCorrectWinner"
                  className="text-[10px] font-medium"
                >
                  Vencedor
                </label>
                <Input
                  id="scoringCorrectWinner"
                  name="scoringCorrectWinner"
                  type="number"
                  min={0}
                  defaultValue={sc?.correct_winner ?? DEFAULT_SCORING.correct_winner}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="scoringExactScore"
                  className="text-[10px] font-medium"
                >
                  Placar exato
                </label>
                <Input
                  id="scoringExactScore"
                  name="scoringExactScore"
                  type="number"
                  min={0}
                  defaultValue={sc?.exact_score ?? DEFAULT_SCORING.exact_score}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="scoringCorrectScorer"
                  className="text-[10px] font-medium"
                >
                  Artilheiro
                </label>
                <Input
                  id="scoringCorrectScorer"
                  name="scoringCorrectScorer"
                  type="number"
                  min={0}
                  defaultValue={sc?.correct_scorer ?? DEFAULT_SCORING.correct_scorer}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full gap-2"
          size="lg"
          disabled={loading}
        >
          <Save className="h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Alteracoes"}
        </Button>
      </form>

      {isOwner && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-bold text-destructive">Zona de perigo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Excluir o bolao remove o ranking e todos os participantes. Os
            palpites dos jogos NAO sao afetados (sao do app todo). Nao da pra
            desfazer.
          </p>
          <Button
            variant="destructive"
            className="mt-3 w-full gap-2"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir bolao
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir &quot;{group.name}&quot;?</DialogTitle>
            <DialogDescription>
              Essa acao nao pode ser desfeita. O bolao e o ranking dele serao
              removidos para todos os membros.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleting ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
