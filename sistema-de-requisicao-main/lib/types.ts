// lib/types.ts
export type Role = "ADMIN" | "REPOSITOR" | "ESTOQUISTA";
export type RequisitionStatus = "PENDING" | "PICKING" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Sector {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  unit: string; // KG, UN, CX
  sectorIds: string[]; // setores em que o item está disponível
  cost?: number; // opcional: nem todo item tem custo cadastrado no ERP
}

export interface RequisitionItem {
  id: string;
  itemId: string;
  quantity: number;
  picked?: boolean; // undefined/false = ainda não separado na tela de picking
}

export interface Requisition {
  id: string;
  sectorId: string;
  status: RequisitionStatus;
  createdAt: string;
  requesterName: string;
  items: RequisitionItem[];
}

export const STATUS_LABELS: Record<RequisitionStatus, string> = {
  PENDING: "Pendente",
  PICKING: "Em Separação",
  COMPLETED: "Concluído",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  REPOSITOR: "Repositor",
  ESTOQUISTA: "Estoquista",
};
