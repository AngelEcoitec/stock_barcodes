/** @odoo-module */

import {ViewCompiler} from "@web/views/view_compiler";
import {patch} from "@web/core/utils/patch";

const originalCompileButton = ViewCompiler.prototype.compileButton;

patch(ViewCompiler.prototype,{ name :"Add hotkey props to button tag", 
    compileButton(el, params) {
        const hotkey = el.getAttribute("data-hotkey");
        el.removeAttribute("data-hotkey");


        const button = originalCompileButton.apply(this, arguments);
        if (hotkey) {
            button.setAttribute("hotkey", hotkey);
        }
        return button;
    },
});
