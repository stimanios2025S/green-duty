"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Send, Wallet, Receipt, PiggyBank, AlertTriangle, Banknote } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { OwnerShell, OwnerDenied } from "@/components/dashboard/OwnerShell";
import {
  Modal,
  Field,
  TextInput,
  TextArea,
  Select,
  GhostButton,
  PrimaryButton,
  EmptyState,
  ErrorNote,
  InlineSpinner,
  ConfirmDialog,
} from "@/components/dashboard/kit";
import { ownerGet, ownerSend, ownerDelete } from "@/lib/agency-client";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  formatMoney,
  todayISO,
  type Invoice,
  type Payment,
  type ProjectRow,
} from "@/lib/agency";
import { cn } from "@/lib/utils";

interface InvoiceForm {
  invoiceNumber: string;
  projectId: string;
  amount: string;
  depositReceived: string;
  status: string;
  dueDate: string;
  notes: string;
}

const EMPTY_INVOICE: InvoiceForm = {
  invoiceNumber: "",
  projectId: "",
  amount: "",
  depositReceived: "",
  status: "draft",
  dueDate: "",
  notes: "",
};

interface PaymentForm {
  invoiceId: string;
  projectId: string;
  amount: string;
  method: string;
  reference: string;
  receivedAt: string;
  notes: string;
}

const emptyPayment = (): PaymentForm => ({
  invoiceId: "",
  projectId: "",
  amount: "",
  method: "bank_transfer",
  reference: "",
  receivedAt: todayISO(),
  notes: "",
});

export default function FinancePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [denied, setDenied] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [statusFilter, setStatusFilter] = useState("");

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(EMPTY_INVOICE);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPayment);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // Loads run inside the effect below, with state set only from promise
  // callbacks — calling a state-setting helper from an effect is what
  // react-hooks/set-state-in-effect flags. `load` bumps a key instead.
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    Promise.all([
      ownerGet<{ invoices: Invoice[] }>("/api/invoices"),
      ownerGet<{ payments: Payment[] }>("/api/payments"),
      ownerGet<{ projects: ProjectRow[] }>("/api/projects"),
    ]).then(([invoicesRes, paymentsRes, projectsRes]) => {
      if (cancelled) return;
      if (invoicesRes.ok) {
        setInvoices(invoicesRes.data.invoices || []);
        setDenied(false);
        setError("");
      } else if (invoicesRes.status === 403 || invoicesRes.status === 401) {
        setDenied(true);
      } else {
        setError(invoicesRes.error);
      }
      if (paymentsRes.ok) setPayments(paymentsRes.data.payments || []);
      if (projectsRes.ok) setProjects(projectsRes.data.projects || []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  /* ── Finance totals, computed from the live records ── */
  const totals = useMemo(() => {
    const invoiced = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    const issued = invoices.filter(i => i.status !== "draft");
    const outstanding = issued.reduce((s, i) => s + Number(i.balance_due || 0), 0);
    const overdue = invoices
      .filter(i => i.status === "overdue")
      .reduce((s, i) => s + Number(i.balance_due || 0), 0);
    const deposits = invoices.reduce((s, i) => s + Number(i.deposit_received || 0), 0);
    const received = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { invoiced, outstanding, overdue, deposits, received };
  }, [invoices, payments]);

  const visibleInvoices = useMemo(
    () => (statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices),
    [invoices, statusFilter]
  );

  /* ── Invoice create / edit ── */
  const openCreateInvoice = () => {
    setEditingInvoice(null);
    setInvoiceForm({ ...EMPTY_INVOICE, dueDate: "" });
    setInvoiceError("");
    setInvoiceOpen(true);
  };

  const openEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      invoiceNumber: invoice.invoice_number || "",
      projectId: invoice.project_id || "",
      amount: String(invoice.amount ?? ""),
      depositReceived: invoice.deposit_received ? String(invoice.deposit_received) : "",
      status: invoice.status || "draft",
      dueDate: invoice.due_date || "",
      notes: invoice.notes || "",
    });
    setInvoiceError("");
    setInvoiceOpen(true);
  };

  const saveInvoice = async () => {
    if (!userId) return;
    const amount = Number(invoiceForm.amount);
    if (!(amount > 0)) {
      setInvoiceError("Enter an amount greater than zero.");
      return;
    }
    setSavingInvoice(true);
    setInvoiceError("");

    const payload = {
      invoiceNumber: invoiceForm.invoiceNumber.trim(),
      projectId: invoiceForm.projectId,
      amount,
      depositReceived: Number(invoiceForm.depositReceived) || 0,
      // An invoice's stored status can't be "overdue" — that's derived from
      // the due date — so send `sent` when showing an overdue invoice back.
      status: invoiceForm.status === "overdue" ? "sent" : invoiceForm.status,
      dueDate: invoiceForm.dueDate,
      notes: invoiceForm.notes,
    };

    const res = editingInvoice
      ? await ownerSend(`/api/invoices/${encodeURIComponent(editingInvoice.id)}`, "PATCH", payload)
      : await ownerSend("/api/invoices", "POST", payload);

    if (res.ok) {
      setInvoiceOpen(false);
      await load();
    } else {
      setInvoiceError(res.error);
    }
    setSavingInvoice(false);
  };

  const markSent = async (invoice: Invoice) => {
    if (!userId) return;
    const res = await ownerSend(
      `/api/invoices/${encodeURIComponent(invoice.id)}`,
      "PATCH",
      { action: "mark_sent" }
    );
    if (res.ok) await load();
    else setError(res.error);
  };

  /* ── Payments ── */
  const openPayment = (invoice?: Invoice) => {
    const base = emptyPayment();
    if (invoice) {
      base.invoiceId = invoice.id;
      base.projectId = invoice.project_id || "";
      // Prefill with what's still owed — the common case.
      base.amount = invoice.balance_due > 0 ? String(invoice.balance_due) : "";
    }
    setPaymentForm(base);
    setPaymentError("");
    setPaymentOpen(true);
  };

  const onPaymentInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    setPaymentForm(prev => ({
      ...prev,
      invoiceId,
      projectId: invoice?.project_id || prev.projectId,
      amount:
        invoice && invoice.balance_due > 0 && !prev.amount ? String(invoice.balance_due) : prev.amount,
    }));
  };

  const savePayment = async () => {
    if (!userId) return;
    const amount = Number(paymentForm.amount);
    if (!(amount > 0)) {
      setPaymentError("Enter an amount greater than zero.");
      return;
    }
    setSavingPayment(true);
    setPaymentError("");

    const res = await ownerSend("/api/payments", "POST", {
      invoiceId: paymentForm.invoiceId,
      projectId: paymentForm.projectId,
      amount,
      method: paymentForm.method,
      reference: paymentForm.reference,
      receivedAt: paymentForm.receivedAt,
      notes: paymentForm.notes,
    });

    if (res.ok) {
      setPaymentOpen(false);
      await load();
    } else {
      setPaymentError(res.error);
    }
    setSavingPayment(false);
  };

  const confirmDelete = async () => {
    if (!userId) return;
    setDeleteBusy(true);
    const res = pendingInvoice
      ? await ownerDelete(`/api/invoices/${encodeURIComponent(pendingInvoice.id)}`)
      : pendingPayment
      ? await ownerDelete(`/api/payments/${encodeURIComponent(pendingPayment.id)}`)
      : { ok: true as const };

    if (res.ok) {
      setPendingInvoice(null);
      setPendingPayment(null);
      await load();
    } else {
      setError(res.error);
      setPendingInvoice(null);
      setPendingPayment(null);
    }
    setDeleteBusy(false);
  };

  if (isLoading || !user) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>;
  }

  if (denied) return <OwnerDenied />;

  const selectedInvoice = invoices.find(i => i.id === paymentForm.invoiceId);

  return (
    <OwnerShell
      title="Finance"
      subtitle="Invoices, deposits and everything still owed to you."
      actions={
        <>
          <GhostButton onClick={() => openPayment()}>
            <Banknote className="h-4 w-4" />
            Record Payment
          </GhostButton>
          <PrimaryButton onClick={openCreateInvoice}>
            <Plus className="h-4 w-4" />
            New Invoice
          </PrimaryButton>
        </>
      }
    >
      <ErrorNote>{error}</ErrorNote>

      {/* ── Totals ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Invoiced" value={formatMoney(totals.invoiced)} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Total Received" value={formatMoney(totals.received)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard
          label="Deposits Received"
          value={formatMoney(totals.deposits)}
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(totals.outstanding)}
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label="Overdue"
          value={formatMoney(totals.overdue)}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <Card>
        {/* Tabs */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-gd-border bg-gd-base p-1">
            {(["invoices", "payments"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all",
                  tab === t
                    ? "bg-gradient-to-r from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400"
                    : "text-gd-text-secondary hover:text-gd-text-primary"
                )}
              >
                {t} {t === "invoices" ? `(${invoices.length})` : `(${payments.length})`}
              </button>
            ))}
          </div>

          {tab === "invoices" && (
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="sm:w-48"
            >
              <option value="">All statuses</option>
              {INVOICE_STATUSES.map(s => (
                <option key={s} value={s}>
                  {INVOICE_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </div>

        {loading ? (
          <InlineSpinner label="Loading finance…" />
        ) : tab === "invoices" ? (
          visibleInvoices.length === 0 ? (
            <EmptyState
              title={statusFilter ? "No invoices with that status" : "No invoices yet"}
              message={
                statusFilter
                  ? "Try a different status filter."
                  : "Raise your first invoice against a project to start tracking what you're owed."
              }
              action={
                !statusFilter ? (
                  <PrimaryButton onClick={openCreateInvoice}>
                    <Plus className="h-4 w-4" />
                    New Invoice
                  </PrimaryButton>
                ) : undefined
              }
            />
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-gd-border text-left text-[11px] uppercase tracking-wider text-gd-text-muted">
                    <th className="pb-3 font-medium">Invoice</th>
                    <th className="pb-3 font-medium">Client / Project</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                    <th className="pb-3 text-right font-medium">Paid</th>
                    <th className="pb-3 text-right font-medium">Balance</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map(inv => (
                    <tr key={inv.id} className="border-b border-gd-border/60 last:border-0 hover:bg-gd-elevated/30">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gd-text-primary">{inv.invoice_number}</p>
                        <p className="text-[11px] text-gd-text-muted">
                          {inv.due_date ? `Due ${inv.due_date}` : "No due date"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-gd-text-secondary">{inv.client_name || "—"}</p>
                        <p className="text-[11px] text-gd-text-muted">{inv.project_title || "No project"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={INVOICE_STATUS_VARIANT[inv.status] || "default"}>
                          {INVOICE_STATUS_LABEL[inv.status] || inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right text-gd-text-secondary">{formatMoney(inv.amount)}</td>
                      <td className="py-3 pr-4 text-right text-gd-text-secondary">{formatMoney(inv.amount_paid)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-gd-text-primary">
                        {formatMoney(inv.balance_due)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          {inv.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => markSent(inv)}
                              className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-accent-400"
                              title="Mark as sent"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {inv.balance_due > 0 && inv.status !== "draft" && (
                            <button
                              type="button"
                              onClick={() => openPayment(inv)}
                              className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-success"
                              title="Record payment"
                            >
                              <Banknote className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditInvoice(inv)}
                            className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingInvoice(inv)}
                            className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-danger/10 hover:text-gd-danger"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments recorded"
            message="Record a deposit or payment against an invoice and it will show up here."
            action={
              <PrimaryButton onClick={() => openPayment()}>
                <Banknote className="h-4 w-4" />
                Record Payment
              </PrimaryButton>
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-gd-border text-left text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <th className="pb-3 font-medium">Received</th>
                  <th className="pb-3 font-medium">Client / Project</th>
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(pay => (
                  <tr key={pay.id} className="border-b border-gd-border/60 last:border-0 hover:bg-gd-elevated/30">
                    <td className="py-3 pr-4 text-gd-text-secondary">{pay.received_at}</td>
                    <td className="py-3 pr-4">
                      <p className="text-gd-text-secondary">{pay.client_name || "—"}</p>
                      <p className="text-[11px] text-gd-text-muted">{pay.project_title || "No project"}</p>
                    </td>
                    <td className="py-3 pr-4 text-gd-text-secondary">
                      {pay.invoice_number || "—"}
                      {pay.reference && <p className="text-[11px] text-gd-text-muted">Ref {pay.reference}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge>{PAYMENT_METHOD_LABEL[pay.method] || pay.method}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gd-text-primary">
                      {formatMoney(pay.amount)}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setPendingPayment(pay)}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-danger/10 hover:text-gd-danger"
                          title="Remove payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Invoice modal ── */}
      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title={editingInvoice ? `Edit ${editingInvoice.invoice_number}` : "New invoice"}
        subtitle={
          editingInvoice
            ? "Changing the amount recalculates the balance from recorded payments."
            : "Leave the number empty to use the next one in the sequence."
        }
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice number" hint="Auto-generated when left blank.">
              <TextInput
                value={invoiceForm.invoiceNumber}
                onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                placeholder="INV-2026-0001"
              />
            </Field>

            <Field label="Project">
              <Select
                value={invoiceForm.projectId}
                onChange={e => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
              >
                <option value="">— No project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.client_name ? ` · ${p.client_name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Amount">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={invoiceForm.amount}
                onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                placeholder="0"
              />
            </Field>

            <Field label="Deposit received" hint="Recorded against this invoice.">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={invoiceForm.depositReceived}
                onChange={e => setInvoiceForm({ ...invoiceForm, depositReceived: e.target.value })}
                placeholder="0"
              />
            </Field>

            <Field label="Status">
              <Select value={invoiceForm.status} onChange={e => setInvoiceForm({ ...invoiceForm, status: e.target.value })}>
                {INVOICE_STATUSES.filter(s => s !== "overdue").map(s => (
                  <option key={s} value={s}>
                    {INVOICE_STATUS_LABEL[s]}
                  </option>
                ))}
                {invoiceForm.status === "overdue" && <option value="overdue">Overdue</option>}
              </Select>
            </Field>

            <Field label="Due date">
              <TextInput
                type="date"
                value={invoiceForm.dueDate}
                onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notes">
            <TextArea
              value={invoiceForm.notes}
              onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              placeholder="Payment terms, milestones, references…"
            />
          </Field>

          <ErrorNote>{invoiceError}</ErrorNote>

          <div className="flex justify-end gap-2 pt-1">
            <GhostButton type="button" onClick={() => setInvoiceOpen(false)} disabled={savingInvoice}>
              Cancel
            </GhostButton>
            <PrimaryButton type="button" onClick={saveInvoice} loading={savingInvoice}>
              {editingInvoice ? "Save changes" : "Create invoice"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* ── Payment modal ── */}
      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record a payment"
        subtitle="Deposits and instalments received against an invoice."
        wide
      >
        <div className="space-y-4">
          <Field label="Invoice" hint="Optional — leave empty for a payment not tied to an invoice.">
            <Select value={paymentForm.invoiceId} onChange={e => onPaymentInvoiceChange(e.target.value)}>
              <option value="">— No invoice —</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number}
                  {inv.client_name ? ` · ${inv.client_name}` : ""} — {formatMoney(inv.balance_due)} due
                </option>
              ))}
            </Select>
          </Field>

          {selectedInvoice && (
            <div className="rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5 text-xs text-gd-text-secondary">
              {selectedInvoice.invoice_number} · invoiced {formatMoney(selectedInvoice.amount)} · already paid{" "}
              {formatMoney(selectedInvoice.amount_paid)} ·{" "}
              <span className="font-medium text-gd-text-primary">
                {formatMoney(selectedInvoice.balance_due)} remaining
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0"
              />
            </Field>

            <Field label="Method">
              <Select
                value={paymentForm.method}
                onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Reference" hint="Cheque number, transfer ID…">
              <TextInput
                value={paymentForm.reference}
                onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Optional"
              />
            </Field>

            <Field label="Received on">
              <TextInput
                type="date"
                value={paymentForm.receivedAt}
                onChange={e => setPaymentForm({ ...paymentForm, receivedAt: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notes">
            <TextArea
              value={paymentForm.notes}
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Anything worth remembering about this payment…"
            />
          </Field>

          <ErrorNote>{paymentError}</ErrorNote>

          <div className="flex justify-end gap-2 pt-1">
            <GhostButton type="button" onClick={() => setPaymentOpen(false)} disabled={savingPayment}>
              Cancel
            </GhostButton>
            <PrimaryButton type="button" onClick={savePayment} loading={savingPayment}>
              Record payment
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingInvoice || !!pendingPayment}
        title={pendingInvoice ? "Delete invoice?" : "Remove payment?"}
        message={
          pendingInvoice
            ? `${pendingInvoice.invoice_number} will be permanently removed. Invoices with payments recorded can't be deleted.`
            : "This payment will be removed and the invoice balance recalculated."
        }
        confirmLabel={pendingInvoice ? "Delete" : "Remove"}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => {
          setPendingInvoice(null);
          setPendingPayment(null);
        }}
      />
    </OwnerShell>
  );
}
