/** @odoo-module **/

import { BarcodeHandlerField } from "@barcodes/barcode_handler_field";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { useEffect } from "@odoo/owl";

// Guardamos los métodos originales
const originalSetup = BarcodeHandlerField.prototype.setup;
const originalOnBarcodeScanned = BarcodeHandlerField.prototype.onBarcodeScanned;

patch(BarcodeHandlerField.prototype, {
    name: "stock_barcodes.BarcodeHandlerField",

    setup(...args) {
        // Llamar la lógica original (si existe)
        if (originalSetup) {
            originalSetup.apply(this, args);
        }

        // Llamada a hooks dentro del contexto de Owl
        const busService = useService("bus_service");
        const ormService = useService("orm"); // Asegúrate de que "orm" sea un servicio real en Odoo 17

        const notifyChanges = async ({ detail: notifications }) => {
            for (const { payload, type } of notifications) {
                if (type === "stock_barcodes_refresh_data") {
                    // Asegúrate de que "this.env.model.root" exista:
                    // Si BarcodeHandlerField no es un componente Owl real, "this.env" podría no estar definido.
                    await this.env.model.root.load();
                    this.env.model.notify();
                }
            }
        };

        // useEffect para suscribirse y limpiar
        useEffect(() => {
            busService.addChannel("barcode_reload");
            busService.addEventListener("notification", notifyChanges);

            return () => {
                busService.deleteChannel("barcode_reload");
                busService.removeEventListener("notification", notifyChanges);
            };
        });
    },

    onBarcodeScanned(event) {
        // Llamar al método original
        if (originalOnBarcodeScanned) {
            originalOnBarcodeScanned.apply(this, arguments);
        }

        // Lógica adicional
        if (this.props?.record?.resModel?.includes("wiz.stock.barcodes.read")) {
            $("#dummy_on_barcode_scanned").click();
        }
    },
});
