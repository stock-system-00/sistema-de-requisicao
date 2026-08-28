// components/sidebar.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentListIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout, getUsuarioAtual, getDbStorageUsage } from "@/app/actions/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/requisicao", label: "Separação", icon: ClipboardDocumentCheckIcon },
  { href: "/historico", label: "Histórico", icon: ClockIcon },
  { href: "/admin", label: "Cadastros", icon: Cog6ToothIcon },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: ClipboardDocumentListIcon,
  },
];

interface UserData {
  name: string;
  email: string;
  role: string;
}

interface StorageData {
  usedMb: number;
  limitMb: number;
  percentage: number;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [storage, setStorage] = useState<StorageData | null>(null);

  useEffect(() => {
    // 1. Tenta pegar os dados cacheados na sessão
    const cachedUser = sessionStorage.getItem("@req-user");
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    } else {
      getUsuarioAtual().then((data) => {
        if (data) {
          setUser(data);
          sessionStorage.setItem("@req-user", JSON.stringify(data));
        }
      });
    }

    // Busca também os dados de memória no carregamento para ser instantâneo
    const cachedStorage = sessionStorage.getItem("@req-storage");
    if (cachedStorage) {
      setStorage(JSON.parse(cachedStorage));
    } else {
      getDbStorageUsage().then((data) => {
        setStorage(data);
        sessionStorage.setItem("@req-storage", JSON.stringify(data));
      });
    }
  }, []);

  async function handleLogout() {
    sessionStorage.removeItem("@req-user");
    await logout();
    router.push("/login");
  }

  const getProgressBarColor = (pct: number) => {
    if (pct >= 80) return "bg-red-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStatusText = (pct: number) => {
    if (pct >= 80) return "Atenção: Espaço quase cheio!";
    if (pct >= 50) return "Uso moderado do sistema.";
    return "Tudo tranquilo, muito espaço disponível.";
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExportBackup() {
    try {
      setIsExporting(true);
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Falha ao gerar backup");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_sistema_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erro ao baixar backup.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("ATENÇÃO: A importação apagará TODOS os dados atuais do sistema e os substituirá pelo arquivo de backup. Deseja continuar?")) {
       if (fileInputRef.current) fileInputRef.current.value = "";
       return;
    }

    try {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const jsonStr = event.target?.result as string;
        try {
          const res = await fetch("/api/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: jsonStr,
          });
          
          if (!res.ok) throw new Error("Erro na restauração.");
          alert("Backup restaurado com sucesso! A página será recarregada.");
          sessionStorage.clear();
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert("Erro ao restaurar backup. Verifique se o arquivo é válido.");
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="flex h-full flex-col bg-card border-r border-border shadow-xl">
        {/* Cabeçalho */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <span className="font-semibold text-foreground text-base tracking-tight">
            Requisição <span className="text-primary">Digital</span>
          </span>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 min-h-12",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-border p-3 flex flex-col gap-3">
          {/* Botão de Uso do Banco de Dados */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-border bg-accent/30 hover:bg-accent hover:text-accent-foreground transition-colors text-xs font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <CircleStackIcon className="size-4 text-primary" />
              <span>Mémoria</span>
            </span>
            <span className="font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {storage ? `${storage.usedMb} MB` : "..."}
            </span>
          </button>

          {/* Usuário */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              {user?.name?.charAt(0).toUpperCase() ?? "-"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground leading-tight">
                {user?.name || "Carregando..."}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {user?.email || "aguarde..."}
              </p>
            </div>
          </div>

          {/* Botão Sair */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors border border-border rounded-xl h-10"
          >
            <ArrowLeftOnRectangleIcon className="size-4" />
            <span className="text-sm">Sair da conta</span>
          </Button>
        </div>
      </div>

      {/* Modal de Uso do Banco de Dados */}
      <Dialog open={isDbModalOpen} onOpenChange={setIsDbModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleStackIcon className="size-5 text-primary" />
              <span>Espaço do Sistema (Banco de Dados)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plano Atual:</span>
                <span className="font-semibold text-foreground">Gratuito</span>
              </div>

              {/* Informação de Uso em Linguagem Leiga */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Espaço utilizado:
                  </span>
                  <span className="font-semibold text-foreground">
                    {storage
                      ? `${storage.usedMb} MB de ${storage.limitMb} MB`
                      : "Carregando..."}
                  </span>
                </div>

                {/* Barra de Progresso Dinâmica */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      getProgressBarColor(storage?.percentage || 0),
                    )}
                    style={{ width: `${storage?.percentage || 0}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>{storage ? `${storage.percentage}% usado` : ""}</span>
                  <span className="font-medium text-foreground">
                    {storage ? getStatusText(storage.percentage) : ""}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Status geral:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Sistema Operando Normalmente
                </span>
              </div>
            </div>

            {/* Ações de Backup */}
            <div className="pt-2">
               <h4 className="text-sm font-semibold mb-3">Segurança e Backup</h4>
               <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={handleExportBackup}
                    disabled={isExporting || isImporting}
                  >
                     {isExporting ? "Baixando..." : "Baixar Backup"}
                  </Button>
                  
                  <div className="flex-1">
                     <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleImportBackup} 
                        className="hidden" 
                     />
                     <Button 
                       variant="destructive" 
                       className="w-full bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white border-0" 
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isExporting || isImporting}
                     >
                       {isImporting ? "Restaurando..." : "Importar Backup"}
                     </Button>
                  </div>
               </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Este espaço armazena com segurança todos os seus produtos, setores
              e o histórico de requisições da empresa. O backup garante que você não perca nada.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
