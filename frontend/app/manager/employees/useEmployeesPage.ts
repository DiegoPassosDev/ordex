"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Employee, EmployeeRole } from "@/types";
import { toast } from "@/components/ui/Toast";
import { RESTAURANT_ID_FALLBACK } from "@/constants";

const RESTAURANT_FALLBACK = RESTAURANT_ID_FALLBACK;

export function useEmployeesPage() {
  const { employee, updateEmployee } = useAuthStore();
  const restaurantId = employee?.restaurantId || RESTAURANT_FALLBACK;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const active = employees.filter((e) => e.active).length;

  const byRole = {
    MANAGER: employees.filter((e) => e.role === "MANAGER").length,
    WAITER: employees.filter((e) => e.role === "WAITER").length,
    KITCHEN: employees.filter((e) => e.role === "KITCHEN").length,
    BAR: employees.filter((e) => e.role === "BAR").length,
    CASHIER: employees.filter((e) => e.role === "CASHIER").length,
  };

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/employees/restaurant/${restaurantId}`);
      setEmployees(data);
    } catch {
      toast.error("Erro ao carregar equipe.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  async function handleAdd(data: {
    name: string;
    email: string;
    password: string;
    pin: string;
    role: string;
  }) {
    setSaving(true);
    try {
      await api.post("/employees", { ...data, restaurantId });
      toast.success("Funcionário cadastrado com sucesso!");
      setShowModal(false);
      loadEmployees();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao cadastrar.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: {
    name: string;
    email: string;
    role: string;
  }) {
    if (!editingEmployee) return;
    setSaving(true);
    try {
      await api.patch(`/employees/${editingEmployee.id}`, data);
      if (editingEmployee.id === employee?.id) {
        updateEmployee({ ...data, role: data.role as EmployeeRole });
      }
      toast.success("Funcionário atualizado com sucesso!");
      setShowModal(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao atualizar.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(emp: Employee) {
    try {
      await api.patch(`/employees/${emp.id}`, { active: !emp.active });
      toast.success(
        emp.active ? "Funcionário desativado." : "Funcionário ativado.",
      );
      loadEmployees();
    } catch {
      toast.error("Erro ao atualizar funcionário.");
    }
  }

  function openAddModal() {
    setEditingEmployee(null);
    setShowModal(true);
  }

  function openEditModal(emp: Employee) {
    setEditingEmployee(emp);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEmployee(null);
  }

  return {
    employees,
    loading,
    saving,
    showModal,
    editingEmployee,
    modalMode: editingEmployee ? "edit" as const : "add" as const,
    active,
    byRole,
    restaurantId,
    loadEmployees,
    handleAdd,
    handleUpdate,
    handleToggleActive,
    openAddModal,
    openEditModal,
    closeModal,
  };
}
