"use client";

import { Printer, RefreshCw, Wifi, HelpCircle, WifiOff, Monitor, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CustomToaster } from "@/components/ui/Toast";
import { useDevicePage, isReceipt } from "./useDevicePage";

export default function DevicePage() {
  const d = useDevicePage();

  if (!d.configured) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <CustomToaster />
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4">
              <Printer className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Configurar Dispositivo</h1>
            <p className="text-sm text-gray-400 mt-2">
              Configure este dispositivo para impressão de comandas
            </p>
          </div>

          <Card>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  ID do Restaurante
                </label>
                <input
                  placeholder="UUID do restaurante"
                  value={d.restaurantId}
                  onChange={(e) => d.setRestaurantId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Localização
                </label>
                <select
                  value={d.location}
                  onChange={(e) => d.setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="COZINHA">Cozinha</option>
                  <option value="BAR">Bar</option>
                  <option value="CAIXA">Caixa</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">
                  Modo de impressão
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => d.setPrintMode("browser")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      d.printMode === "browser"
                        ? "bg-orange-500/10 border-orange-500 text-orange-400"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <Monitor className="w-6 h-6" />
                    <span className="text-sm font-medium">Navegador</span>
                    <span className="text-xs text-gray-400">Qualquer impressora</span>
                  </button>
                  <button
                    onClick={() => d.setPrintMode("network")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      d.printMode === "network"
                        ? "bg-orange-500/10 border-orange-500 text-orange-400"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <Wifi className="w-6 h-6" />
                    <span className="text-sm font-medium">Rede (ESC/POS)</span>
                    <span className="text-xs text-gray-400">Impressora térmica</span>
                  </button>
                </div>
              </div>

              {d.printMode === "network" && (
                <>
                  <hr className="border-gray-700" />
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-3">
                      Buscar impressora na rede
                    </p>
                    <Button
                      icon={d.scanning ? RefreshCw : Wifi}
                      onClick={d.scanNetwork}
                      loading={d.scanning}
                      className="w-full"
                    >
                      {d.scanning ? "Buscando..." : "Auto-descobrir impressoras"}
                    </Button>
                  </div>

                  {d.discovered.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-green-400 font-medium">
                        {d.discovered.length} impressora(s) encontrada(s):
                      </p>
                      {d.discovered.map((p) => (
                        <button
                          key={p.ip}
                          onClick={() => d.configureWithPrinter(p)}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-700 border border-gray-600 hover:border-green-500/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Wifi className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white font-mono">
                              {p.ip}:{p.port}
                            </span>
                          </div>
                          <span className="text-xs text-green-400">Selecionar</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <hr className="border-gray-700" />

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-3">
                      Configuração manual
                    </p>
                    <div className="flex gap-2">
                      <input
                        placeholder="IP da impressora"
                        value={d.manualIp}
                        onChange={(e) => d.setManualIp(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm"
                      />
                      <input
                        type="number"
                        value={d.manualPort}
                        onChange={(e) => d.setManualPort(Number(e.target.value))}
                        className="w-24 px-3 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                      Sub-rede
                    </label>
                    <input
                      placeholder="192.168.1"
                      value={d.subnet}
                      onChange={(e) => d.setSubnet(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm"
                    />
                  </div>

                  <div className="bg-gray-700/30 rounded-xl p-4 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-medium text-blue-400">
                        Como encontrar o IP da impressora
                      </p>
                    </div>
                    <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
                      <li>Na impressora, pressione o botão <strong className="text-gray-300">Menu</strong></li>
                      <li>Navegue até <strong className="text-gray-300">Configurações</strong> &gt; <strong className="text-gray-300">Rede</strong></li>
                      <li>Imprima a <strong className="text-gray-300">página de configuração</strong></li>
                      <li>O IP estará listado na seção <strong className="text-gray-300">Endereço IP</strong></li>
                    </ol>
                  </div>
                </>
              )}

              <Button onClick={d.printMode === "network" ? d.configureManual : d.configureBrowser} className="w-full">
                {d.printMode === "network" ? "Salvar e Conectar" : "Iniciar"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <CustomToaster />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Impressão — {d.location}
              </h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${d.connected ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
                <p className="text-xs text-gray-400">
                  {d.connected ? "Conectado" : "Desconectado — reconectando..."}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={d.resetConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 transition-all"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Reconectar
          </button>
        </div>

        {d.comandas.length === 0 && (
          <div className="text-center py-20">
            <Printer className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Nenhuma comanda recebida ainda
            </p>
          </div>
        )}

        <div className="space-y-3">
          {d.comandas.map((job, i) => {
            if (isReceipt(job)) {
              const r = job;
              return (
                <div
                  key={`${r.orderId}-${i}`}
                  className="bg-gray-800 rounded-xl border border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-orange-400">
                        Mesa {r.tableNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                        Pagamento
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {r.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-400 font-mono">
                          R$ {(item.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-700 mt-2 pt-2 space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Subtotal</span>
                        <span>R$ {r.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {r.serviceCharge > 0 && (
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Serviço</span>
                          <span>R$ {r.serviceCharge.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {r.discount > 0 && (
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Desconto</span>
                          <span>-R$ {r.discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-white">
                        <span>Total</span>
                        <span>R$ {r.finalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Pagamento: {r.method}
                      {r.cashReceived !== null && ` | Recebido: R$ ${r.cashReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      {r.change !== null && r.change > 0 && ` | Troco: R$ ${r.change.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </div>
                  </div>
                  <button
                    onClick={() => d.sendComanda(r)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    Imprimir Comprovante
                  </button>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => d.retryPrint(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Repetir
                    </button>
                    <button
                      onClick={() => d.removeComanda(i)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            }

            const c = job;
            return (
              <div
                key={`${c.orderId}-${i}`}
                className="bg-gray-800 rounded-xl border border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-orange-400">
                    Mesa {c.tableNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleTimeString("pt-BR")}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {c.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 font-mono w-6">
                        {item.quantity}x
                      </span>
                      <span className="text-white">{item.name}</span>
                      {item.notes && (
                        <span className="text-xs text-gray-500 italic">
                          ({item.notes})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => d.sendComanda(c)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Comanda
                </button>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => d.retryPrint(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Repetir
                  </button>
                  <button
                    onClick={() => d.removeComanda(i)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
