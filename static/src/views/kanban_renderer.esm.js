/** @odoo-module **/
/* Copyright 2022 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

 import { KanbanRenderer } from "@web/views/kanban/kanban_renderer";
 import { isAllowedBarcodeModel } from "../utils/barcodes_models_utils.esm";
 import { patch } from "@web/core/utils/patch";
 import { useBus } from "@web/core/utils/hooks";
 import { useHotkey } from "@web/core/hotkeys/hotkey_hook";
 import { useRef } from "@odoo/owl";
 
 // Guardamos el setup original (si existe)
 const originalSetup = KanbanRenderer.prototype.setup;
 
 patch(KanbanRenderer.prototype, {
     name: "add hotkey",
 
     setup(...args) {
         // Llamamos al método original para conservar la lógica base
         if (originalSetup) {
             originalSetup.apply(this, args);
         }
 
         // Agregamos nuestros hooks
         const rootRef = useRef("root");
         useHotkey(
             "Enter",
             ({ target }) => {
                 if (!target.classList.contains("o_kanban_record")) {
                     return;
                 }
                 // Abrir el primer link (acción principal)
                 let firstLink = null;
                 if (isAllowedBarcodeModel(this.props.list.resModel)) {
                     firstLink = target.querySelector(
                         ".oe_kanban_action_button,.oe_btn_quick_action"
                     );
                 }
                 if (!firstLink) {
                     firstLink = target.querySelector(".oe_kanban_global_click, a, button");
                 }
                 if (firstLink && firstLink instanceof HTMLElement) {
                     firstLink.click();
                 }
             },
             { area: () => rootRef.el }
         );
 
         // Si el modelo admite barcode, enfocamos la primera card con action_barcode_scan
         if (isAllowedBarcodeModel(this.props.list.resModel)) {
             if (this.env.searchModel) {
                 useBus(this.env.searchModel, "focus-view", () => {
                     const { model } = this.props.list;
                     if (model.useSampleModel || !model.hasData()) {
                         return;
                     }
                     const cards = Array.from(rootRef.el.querySelectorAll(".o_kanban_record"));
                     const firstCard = cards.find((card) =>
                         card.querySelector('button[name="action_barcode_scan"]')
                     );
                     if (firstCard) {
                         firstCard.focus();
                     }
                 });
             }
         }
     },
 
     /**
      * Redefinimos focusNextCard para seleccionar solo tarjetas con barcode
      * (cuando isAllowedBarcodeModel es verdadero).
      * Copiado de la base kanban_renderer, adaptado a nuestras necesidades.
      */
     focusNextCard(area, direction) {
         const { isGrouped } = this.props.list;
         const closestCard = document.activeElement.closest(".o_kanban_record");
         if (!closestCard) {
             return;
         }
         const groups = isGrouped
             ? [...area.querySelectorAll(".o_kanban_group")]
             : [area];
         let cards = groups
             .map((group) => [...group.querySelectorAll(".o_kanban_record")])
             .filter((group) => group.length);
 
         if (isAllowedBarcodeModel(this.props.list.resModel)) {
             cards = cards.map((group) =>
                 group.filter((card) => card.querySelector('button[name="action_barcode_scan"]'))
             );
         }
 
         let iGroup = null;
         let iCard = null;
         for (iGroup = 0; iGroup < cards.length; iGroup++) {
             const i = cards[iGroup].indexOf(closestCard);
             if (i !== -1) {
                 iCard = i;
                 break;
             }
         }
         if (iCard === undefined) {
             iCard = 0;
             iGroup = 0;
         }
 
         let nextCard = null;
         switch (direction) {
             case "down":
                 nextCard = iCard < cards[iGroup].length - 1 && cards[iGroup][iCard + 1];
                 break;
             case "up":
                 nextCard = iCard > 0 && cards[iGroup][iCard - 1];
                 break;
             case "right":
                 if (isGrouped) {
                     nextCard = iGroup < cards.length - 1 && cards[iGroup + 1][0];
                 } else {
                     nextCard = iCard < cards[0].length - 1 && cards[0][iCard + 1];
                 }
                 break;
             case "left":
                 if (isGrouped) {
                     nextCard = iGroup > 0 && cards[iGroup - 1][0];
                 } else {
                     nextCard = iCard > 0 && cards[0][iCard - 1];
                 }
                 break;
         }
 
         if (nextCard && nextCard instanceof HTMLElement) {
             nextCard.focus();
             return true;
         }
     },
 });
 