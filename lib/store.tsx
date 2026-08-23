// lib/store.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Sector,
  Item,
  Requisition,
  RequisitionItem,
  RequisitionStatus,
  User,
} from "./types";
import {
  mockUser,
  seedSectors,
  seedItems,
  seedRequisitions,
} from "./seed-data";

import type { ParsedCSVItem } from "@/components/csv-importer";

interface StoreContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  sectors: Sector[];
  items: Item[];
  requisitions: Requisition[];
  addSector: (name: string) => void;
  updateSector: (id: string, name: string) => void;
  deleteSector: (id: string) => void;
  addItem: (data: Omit<Item, "id">) => void;
  updateItem: (id: string, data: Omit<Item, "id">) => void;
  deleteItem: (id: string) => void;
  addRequisition: (
    sectorId: string,
    items: { itemId: string; quantity: number }[],
  ) => void;
  updateRequisitionStatus: (id: string, status: RequisitionStatus) => void;
  toggleItemPicked: (reqId: string, reqItemId: string) => void;
  itemName: (id: string) => string;
  itemUnit: (id: string) => string;
  sectorName: (id: string) => string;
  importFromCSV: (data: ParsedCSVItem[]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}${++idCounter}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser);
  const [sectors, setSectors] = useState<Sector[]>(seedSectors);
  const [items, setItems] = useState<Item[]>(seedItems);
  const [requisitions, setRequisitions] =
    useState<Requisition[]>(seedRequisitions);

  const addSector = useCallback((name: string) => {
    setSectors((prev) => [...prev, { id: nextId("s"), name }]);
  }, []);

  const updateSector = useCallback((id: string, name: string) => {
    setSectors((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const deleteSector = useCallback((id: string) => {
    setSectors((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addItem = useCallback((data: Omit<Item, "id">) => {
    setItems((prev) => [...prev, { id: nextId("i"), ...data }]);
  }, []);

  const updateItem = useCallback((id: string, data: Omit<Item, "id">) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { id, ...data } : it)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const addRequisition = useCallback(
    (sectorId: string, reqItems: { itemId: string; quantity: number }[]) => {
      const newReq: Requisition = {
        id: nextId("r"),
        sectorId,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        requesterName: mockUser.name,
        items: reqItems.map(
          (ri): RequisitionItem => ({
            id: nextId("ri"),
            itemId: ri.itemId,
            quantity: ri.quantity,
          }),
        ),
      };
      setRequisitions((prev) => [newReq, ...prev]);
    },
    [user],
  );

  const updateRequisitionStatus = useCallback(
    (id: string, status: RequisitionStatus) => {
      setRequisitions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    },
    [],
  );

  const toggleItemPicked = useCallback((reqId: string, reqItemId: string) => {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              items: r.items.map((it) =>
                it.id === reqItemId ? { ...it, picked: !it.picked } : it,
              ),
            }
          : r,
      ),
    );
  }, []);

  const itemName = useCallback(
    (id: string) => items.find((i) => i.id === id)?.name ?? "—",
    [items],
  );
  const itemUnit = useCallback(
    (id: string) => items.find((i) => i.id === id)?.unit ?? "",
    [items],
  );
  const sectorName = useCallback(
    (id: string) => sectors.find((s) => s.id === id)?.name ?? "—",
    [sectors],
  );

  // Importação: cada linha do CSV traz item + setor (por nome) + custo
  // opcional. Setores novos são criados antes dos itens porque o item
  // referencia o sectorId — por isso os dois setState ficam aninhados
  // (o de items só roda com o array de setores já resolvido).
  const importFromCSV = useCallback((parsedData: ParsedCSVItem[]) => {
    setSectors((prevSectors) => {
      const nextSectors = [...prevSectors];
      const sectorNameMap = new Map<string, string>();
      nextSectors.forEach((s) => sectorNameMap.set(s.name.toLowerCase(), s.id));

      let sectorsChanged = false;

      parsedData.forEach((row) => {
        const sLower = row.sectorName.toLowerCase();
        if (!sectorNameMap.has(sLower)) {
          const newId = nextId("s");
          sectorNameMap.set(sLower, newId);
          nextSectors.push({ id: newId, name: row.sectorName });
          sectorsChanged = true;
        }
      });

      setItems((prevItems) => {
        const nextItems = [...prevItems];
        const itemNameMap = new Map<string, Item>();
        nextItems.forEach((i) => itemNameMap.set(i.name.toLowerCase(), i));

        let itemsChanged = false;

        parsedData.forEach((row) => {
          const sLower = row.sectorName.toLowerCase();
          const sectorId = sectorNameMap.get(sLower)!; // resolvido no passo acima

          const iLower = row.name.toLowerCase();
          const existingItem = itemNameMap.get(iLower);

          if (existingItem) {
            // Item já cadastrado: garante o vínculo com o setor da linha e
            // atualiza o custo só se a planilha trouxer um valor diferente
            let itemUpdated = false;
            const updatedSectorIds = [...existingItem.sectorIds];

            if (!updatedSectorIds.includes(sectorId)) {
              updatedSectorIds.push(sectorId);
              itemUpdated = true;
            }

            if (row.cost !== undefined && row.cost !== existingItem.cost) {
              itemUpdated = true;
            }

            if (itemUpdated) {
              const updated: Item = {
                ...existingItem,
                sectorIds: updatedSectorIds,
                cost: row.cost !== undefined ? row.cost : existingItem.cost,
              };
              itemNameMap.set(iLower, updated);

              const idx = nextItems.findIndex((i) => i.id === updated.id);
              if (idx !== -1) nextItems[idx] = updated;
              itemsChanged = true;
            }
          } else {
            const newItem: Item = {
              id: nextId("i"),
              name: row.name,
              unit: row.unit,
              cost: row.cost,
              sectorIds: [sectorId],
            };
            itemNameMap.set(iLower, newItem);
            nextItems.push(newItem);
            itemsChanged = true;
          }
        });

        return itemsChanged ? nextItems : prevItems;
      });

      return sectorsChanged ? nextSectors : prevSectors;
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        user,
        setUser,
        sectors,
        items,
        requisitions,
        addSector,
        updateSector,
        deleteSector,
        addItem,
        updateItem,
        deleteItem,
        addRequisition,
        updateRequisitionStatus,
        toggleItemPicked,
        itemName,
        itemUnit,
        sectorName,
        importFromCSV,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}
