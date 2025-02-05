/** @odoo-module */
/* Copyright 2021 Tecnativa - Alexandre D. Díaz
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

import {FormController} from "@web/views/form/form_controller";
import {patch} from "@web/core/utils/patch";

const originalSetup = FormController.prototype.setup;

patch(FormController.prototype, { name: "Allow display.controlPanel overriding", 
    setup(...args) {
        if (originalSetup) {
            originalSetup.apply(this, args);
        }
        // Adds support to use control_pannel_hidden from the
        // context to disable the control panel
        if (this.props.context.control_panel_hidden) {
            this.display.controlPanel = false;
        }
    },
});
