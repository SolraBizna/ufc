"use strict";

requirejs(["pako","byte-base64"],(pako,base64)=>{
let h1 = function(text) {
    let ret = document.createElement("h1");
    ret.appendChild(document.createTextNode(text));
    return ret;
}
document.body.appendChild(h1("Ingredients"));
let ingredients_table = document.createElement("table");
ingredients_table.setAttribute("id", "ingredients");
ingredients_table.innerHTML = "<thead><tr><th class='net'>Net</th><th class='wat'>Ingredient</th></tr></thead>";
document.body.appendChild(ingredients_table);
let ingredients_datalist = document.createElement("datalist");
ingredients_datalist.setAttribute("id", "ingredients_datalist");
document.body.appendChild(ingredients_datalist);
document.body.appendChild(h1("Recipes"));
let recipes_table = document.createElement("table");
recipes_table.setAttribute("id", "recipes");
recipes_table.innerHTML = "<thead><tr><th class='buttons' rowspan='2'>&nbsp;</th><th rowspan='2' class='name'>Recipe</th><th colspan='2'>Input</th><th colspan='2'>Output</th></tr><tr><th class='wat'>Ingredient</th><th class='net'>Count</th><th class='wat'>Ingredient</th><th class='net'>Count</th></tr></thead>";
document.body.appendChild(recipes_table);

let recipe_list = [];
let recipes_by_name = {};

let ingredients = {}

class Ingredient {
    constructor(name) {
        this.name = name;
        this.net = 0;
        this.tr = document.createElement("tr");
        this.wat_td = document.createElement("td");
        this.net_td = document.createElement("td");
        this.wat_td.setAttribute("class", "wat");
        this.net_td.setAttribute("class", "net");
        this.wat_td.innerText = name;
        this.net_td.innerText = "???";
        this.tr.appendChild(this.net_td);
        this.tr.appendChild(this.wat_td);
        this.option = document.createElement("option");
        this.option.setAttribute("value", name);
        ingredients_datalist.appendChild(this.option);
        let next = null;
        for(let n = 1; ingredients_table.children[n]; ++n) {
            if(ingredients_table.children[n].children[1].innerText > name) {
                next = ingredients_table.children[n];
                break;
            }
        }
        ingredients_table.insertBefore(this.tr, next);
        ingredients[name] = this;
    }
    apply(x) {
        this.net += x;
        if(this.net >= -0.001 && this.net < 0.001) {
            let had = false;
            for(let n = 0; n < recipe_list.length; ++n) {
                if(recipe_list[n].hasIngredient(this.name)) {
                    had = true;
                    break;
                }
            }
            if(!had) {
                this.remove();
            }
            else {
                this.net_td.setAttribute("class", "net");
                this.net_td.innerText = "0";
            }
        }
        else {
            let sign, net;
            if(this.net > 0) {
                sign = "+";
                net = this.net;
                this.net_td.setAttribute("class", "net pos");
            }
            else {
                sign = "-";
                net = -this.net;
                this.net_td.setAttribute("class", "net neg");
            }
            this.net_td.innerText = sign + net.toFixed(1);
        }
    }
    remove() {
        ingredients_table.removeChild(this.tr);
        ingredients_datalist.removeChild(this.option);
        delete ingredients[this.name];
    }
}

let get_ingredient = function(wat) {
    let ret = ingredients[wat];
    if(!ret)
        ret = new Ingredient(wat);
    return ret;
}

const MAX_PUTS = 4;

let fix_buttons = function(recipe) {
    if(recipe.index == 0)
        recipe.up_button.setAttribute("disabled", true);
    else
        recipe.up_button.removeAttribute("disabled");
    if(recipe.index == recipe_list.length-1)
        recipe.down_button.setAttribute("disabled", true);
    else
        recipe.down_button.removeAttribute("disabled");
}

let suppress_hash_load = false;
let rebuild_hash = function() {
    let out_recipes = [];
    for(let n = 0; n < recipe_list.length; ++n) {
        out_recipes.push(recipe_list[n].distill());
    }
    let raw = JSON.stringify(out_recipes);
    let deflated = pako.deflate(raw);
    let cooked = base64.bytesToBase64(deflated);
    suppress_hash_load = true;
    window.location.hash = cooked;
    // hash change may not get called immediately, sigh
    //suppress_hash_load = false;
}

class Recipe {
    constructor(name, inputs, outputs) {
        let self = this;
        name = name || "";
        inputs = inputs || [];
        outputs = outputs || [];
        console.assert(inputs.length <= MAX_PUTS);
        console.assert(outputs.length <= MAX_PUTS);
        for(let n = 0; n < inputs.length; ++n) {
            if(inputs[n] != null)
                console.assert(inputs[n].length == 2);
        }
        for(let n = 0; n < outputs.length; ++n) {
            if(inputs[n] != null)
                console.assert(outputs[n].length == 2);
        }
        for(let n = 0; n < MAX_PUTS; ++n) {
            inputs[n] = inputs[n] || ["",0];
            outputs[n] = outputs[n] || ["",0];
        }
        this.name = name;
        this.inputs = inputs;
        this.outputs = outputs;
        this.count = 0;
        this.trs = [];
        for(let n = 0; n < MAX_PUTS; ++n) {
            this.trs[n] = document.createElement("tr");
        }
        let button_td = document.createElement("td");
        button_td.setAttribute("rowspan", MAX_PUTS);
        button_td.setAttribute("class", "buttons");
        this.up_button = document.createElement("button");
        this.up_button.appendChild(document.createTextNode("\u25B2"));
        this.kill_button = document.createElement("button");
        this.kill_button.appendChild(document.createTextNode("\u2715"));
        this.down_button = document.createElement("button");
        this.down_button.appendChild(document.createTextNode("\u25BC"));
        if(name == "") this.kill_button.setAttribute("disabled", true);
        if(recipes_table.children.length <= 1)
            this.up_button.setAttribute("disabled", true);
        else {
            // O_O
            recipes_table.children[recipes_table.children.length-MAX_PUTS]
                .children[0].children[2].removeAttribute("disabled");
        }
        this.down_button.setAttribute("disabled", true);
        this.up_button.addEventListener("click", () => self.up());
        this.kill_button.addEventListener("click", () => self.remove());
        this.down_button.addEventListener("click", () => self.down());
        button_td.appendChild(this.up_button);
        button_td.appendChild(this.kill_button);
        button_td.appendChild(this.down_button);
        this.trs[0].appendChild(button_td);
        let name_td = document.createElement("td");
        name_td.setAttribute("class", "name");
        name_td.setAttribute("rowSpan", MAX_PUTS);
        let name_input = document.createElement("input");
        name_input.setAttribute("type", "text");
        name_input.setAttribute("value", name);
        name_input.addEventListener("change", function() {
            if(!self.setName(name_input.value))
                name_input.value = self.name;
            else
                rebuild_hash();
        });
        name_td.appendChild(name_input);
        let count_input = document.createElement("input");
        count_input.setAttribute("type", "number");
        count_input.setAttribute("value", 0);
        count_input.setAttribute("step", 1);
        count_input.addEventListener("change", function() {
            let val = parseFloat(count_input.value);
            if(isNaN(val)) {
                count_input.setCustomValidity("Must be a valid number.");
            }
            else {
                count_input.setCustomValidity("");
                self.unaccount();
                self.count = val;
                self.account();
                rebuild_hash();
            }
        });
        this.count_input = count_input;
        name_td.appendChild(count_input);
        this.trs[0].appendChild(name_td);
        for(let i = 0; i < MAX_PUTS; ++i) {
            let n = i;
            let inname_td = document.createElement("td");
            inname_td.setAttribute("class", "wat");
            let inname_input = document.createElement("input");
            inname_input.setAttribute("type", "text");
            inname_input.setAttribute("value", inputs[n][0]);
            inname_input.setAttribute("list", "ingredients_datalist");
            inname_td.appendChild(inname_input);
            this.trs[n].appendChild(inname_td);
            let incount_td = document.createElement("td");
            incount_td.setAttribute("class", "net");
            let incount_input = document.createElement("input");
            incount_input.setAttribute("type", "number");
            incount_input.setAttribute("step", 1);
            incount_input.setAttribute("value", inputs[n][1]);
            incount_td.appendChild(incount_input);
            this.trs[n].appendChild(incount_td);
            let outname_td = document.createElement("td");
            outname_td.setAttribute("class", "wat");
            let outname_input = document.createElement("input");
            outname_input.setAttribute("type", "text");
            outname_input.setAttribute("value", outputs[n][0]);
            outname_input.setAttribute("list", "ingredients_datalist");
            outname_td.appendChild(outname_input);
            this.trs[n].appendChild(outname_td);
            let outcount_td = document.createElement("td");
            outcount_td.setAttribute("class", "net");
            let outcount_input = document.createElement("input");
            outcount_input.setAttribute("type", "number");
            outcount_input.setAttribute("step", 1);
            outcount_input.setAttribute("value", outputs[n][1]);
            outcount_td.appendChild(outcount_input);
            this.trs[n].appendChild(outcount_td);
            recipes_table.appendChild(this.trs[n]);
            inname_input.addEventListener("change", () => {
                self.unaccount();
                let alt = self.inputs[n][0];
                self.inputs[n][0] = inname_input.value;
                if(alt && alt != "") {
                    get_ingredient(alt).apply(0);
                }
                self.account();
                rebuild_hash();
            });
            outname_input.addEventListener("change", () => {
                self.unaccount();
                let alt = self.outputs[n][0];
                self.outputs[n][0] = outname_input.value;
                if(alt && alt != "") {
                    get_ingredient(alt).apply(0);
                }
                self.account();
                rebuild_hash();
            });
            incount_input.addEventListener("change", () => {
                let val = parseFloat(incount_input.value);
                if(isNaN(val)) {
                    incount_input.setCustomValidity("Must be a valid number.");
                }
                else {
                    incount_input.setCustomValidity("");
                    self.unaccount();
                    self.inputs[n][1] = val;
                    self.account();
                    rebuild_hash();
                }
            });
            outcount_input.addEventListener("change", () => {
                let val = parseFloat(outcount_input.value);
                if(isNaN(val)) {
                    outcount_input.setCustomValidity("Must be a valid number.");
                }
                else {
                    outcount_input.setCustomValidity("");
                    self.unaccount();
                    self.outputs[n][1] = val;
                    self.account();
                    rebuild_hash();
                }
            });
        }
        this.index = recipe_list.length;
        recipe_list.push(this);
        if(name != "") recipes_by_name[name] = this;
        this.account();
    }
    hasIngredient(wat) {
        for(let n = 0; this.inputs[n]; ++n) {
            if(this.inputs[n][0] == wat && this.inputs[n][1]) return true;
        }
        for(let n = 0; this.outputs[n]; ++n) {
            if(this.outputs[n][0] == wat && this.outputs[n][1]) return true;
        }
        return false;
    }
    setCount(nu) {
        this.unaccount();
        this.count = nu;
        this.account();
    }
    setInputs(nu) {
        this.unaccount();
        this.inputs = nu;
        this.account();
    }
    setOutputs(nu) {
        this.unaccount();
        this.outputs = nu;
        this.account();
    }
    account() {
        this.apply(1, -1);
    }
    unaccount() {
        this.apply(-1, 1);
    }
    apply(out_m, in_m) {
        if(this.count == 0) return;
        for(let n = 0; this.inputs[n]; ++n) {
            let el = this.inputs[n];
            let wat = el[0];
            let count = el[1];
            if(wat != "" && count != 0)
                get_ingredient(wat).apply(count * this.count * in_m);
        }
        for(let n = 0; this.outputs[n]; ++n) {
            let el = this.outputs[n];
            let wat = el[0];
            let count = el[1];
            if(wat != "" && count != 0)
                get_ingredient(wat).apply(count * this.count * out_m);
        }
    }
    setName(nu) {
        if(nu == "") return false;
        if(recipes_by_name[nu]) return false;
        if(this.name != "") delete recipes_by_name[this.name];
        else {
            this.kill_button.removeAttribute("disabled");
            new Recipe();
        }
        this.name = nu;
        recipes_by_name[this.name] = this;
        return true;
    }
    remove() {
        this.unaccount();
        if(this.name != "") delete recipes_by_name[this.name];
        for(let n = 0; this.trs[n]; ++n) {
            recipes_table.removeChild(this.trs[n]);
        }
        recipe_list.splice(this.index, 1);
        if(this.index == recipe_list.length && this.index > 0) {
            fix_buttons(recipe_list[this.index-1]);
        }
        else {
            for(let n = this.index; n < recipe_list.length; ++n) {
                recipe_list[n].index = n;
            }
            if(this.index == 0 && recipe_list.length > 0)
                fix_buttons(recipe_list[0]);
        }
    }
    up() {
        if(this.index != 0) {
            recipe_list.splice(this.index, 1);
            recipe_list.splice(this.index-1, 0, this);
            recipe_list[this.index].index = this.index;
            fix_buttons(recipe_list[this.index]);
            --this.index;
            let before = recipe_list[this.index+1].trs[0];
            for(let n = 0; n < MAX_PUTS; ++n) {
                recipes_table.insertBefore(this.trs[n], before);
            }
        }
        fix_buttons(this);
    }
    down() {
        if(this.index != recipe_list.length-1) {
            recipe_list.splice(this.index, 1);
            recipe_list.splice(this.index+1, 0, this);
            recipe_list[this.index].index = this.index;
            fix_buttons(recipe_list[this.index]);
            ++this.index;
            let before = null;
            if(this.index+1 < recipe_list.length) {
                before = recipe_list[this.index+1].trs[0];
            }
            for(let n = 0; n < MAX_PUTS; ++n) {
                recipes_table.insertBefore(this.trs[n], before);
            }
        }
        fix_buttons(this);
    }
    distill() {
        let ret = {};
        if(this.name != "") ret.name = this.name;
        if(this.count != 0) ret.count = this.count;
        let inputs = null;
        let outputs = null;
        for(let n = 0; n < MAX_PUTS; ++n) {
            if(this.inputs[n][0] != "" || this.inputs[n][1] != 0) {
                inputs = inputs || [];
                inputs[n] = this.inputs[n];
            }
            if(this.outputs[n][0] != "" || this.outputs[n][1] != 0) {
                outputs = outputs || [];
                outputs[n] = this.outputs[n];
            }
        }
        if(inputs !== null)
            ret.inputs = inputs;
        if(outputs !== null)
            ret.outputs = outputs;
        return ret;
    }
}

function load_hash() {
    if(suppress_hash_load) {
        suppress_hash_load = false;
        return;
    }
    let hash = window.location.hash;
    if(hash.startsWith("#")) hash = hash.substr(1);
    let deflated = base64.base64ToBytes(hash);
    let stringified = pako.inflate(deflated, {"to":"string"});
    let new_recipes = JSON.parse(stringified);
    for(let n = recipe_list.length - 1; n >= 0; --n) {
        recipe_list[n].remove();
    }
    for(let n = 0; n < new_recipes.length; ++n) {
        let new_recipe = new_recipes[n];
        let recipe = new Recipe(new_recipe.name, new_recipe.inputs, new_recipe.outputs);
        if(new_recipe.count) {
            recipe.count = new_recipe.count;
            recipe.count_input.value = new_recipe.count;
            recipe.account();
        }
    }
}

try {
    if(window.location.hash != "" && window.location.hash != "#") {
        load_hash();
    }
    window.addEventListener("hashchange", load_hash);
}
catch(e) {
    console.error(e);
}
if(recipe_list.length == 0) new Recipe();
});
