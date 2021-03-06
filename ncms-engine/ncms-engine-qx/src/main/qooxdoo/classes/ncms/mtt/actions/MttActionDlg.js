/**
 * Rule action dialog
 * @asset(ncms/icon/16/actions/auction-hammer.png)
 */
qx.Class.define("ncms.mtt.actions.MttActionDlg", {

    extend: qx.ui.window.Window,

    events: {

        /**
         * Then action dialog completed.
         */
        completed: "qx.event.type.Data"
    },

    /**
     * @param caption  {String} Dialog caption
     * @param data     {Object} Action data
     */
    construct: function (caption, data) {
        this.__data = data || {};
        this.__ruleId = data["ruleId"];
        qx.core.Assert.assertNotNull(this.__data);
        qx.core.Assert.assertNotNull(this.__ruleId);

        this.base(arguments, caption != null ? caption : this.tr("Edit action"));
        this.setLayout(new qx.ui.layout.VBox(5, "top", "separator-vertical"));
        this.set({
            modal: true,
            showMinimize: false,
            showMaximize: true,
            allowMaximize: true,
            width: 620,
            height: 400
        });

        var form = this.__form = new sm.ui.form.ExtendedForm();
        var vmgr = form.getValidationManager();
        vmgr.setRequiredFieldMessage(this.tr("This field is required"));

        // Action type
        var el = new sm.ui.form.ButtonField(this.tr("Action"), "ncms/icon/16/actions/auction-hammer.png");
        el.setPlaceholder(this.tr("Choose the action type"));
        el.setReadOnly(true);
        el.setRequired(true);
        el.addListener("execute", this.__selectType, this);
        form.add(el, this.tr("Type"), null, "type");

        // Action description
        el = new qx.ui.form.TextField().set({maxLength: 512});
        el.setValue(data["description"] || "");
        el.setPlaceholder(this.tr("Place a action description here"));
        form.add(el, this.tr("Description"), null, "description");

        // GUI disabled checkbox
        el = new qx.ui.form.CheckBox();
        el.setValue(!!data["enabled"]);
        form.add(el, this.tr("Enabled"), null, "enabled");

        var fr = new sm.ui.form.FlexFormRenderer(form);
        fr.setPaddingBottom(10);
        this.add(fr);

        this.__typeEditorStack = this.__createTypeWidgetStack();
        this.__typeEditorStack.setPaddingBottom(10);
        this.add(this.__typeEditorStack, {flex: 1});

        //----------------- Footer

        var hcont = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({"alignX": "right"}));
        hcont.setPadding(5);

        var bt = new qx.ui.form.Button(this.tr("Ok"));
        bt.addListener("execute", this.__ok, this);
        hcont.add(bt);

        bt = new qx.ui.form.Button(this.tr("Cancel"));
        bt.addListener("execute", this.close, this);
        hcont.add(bt);
        this.add(hcont);

        var cmd = this.createCommand("Esc");
        cmd.addListener("execute", this.close, this);
        this.addListenerOnce("resize", this.center, this);

        var aclazz = (data["type"] != null) ?
                     ncms.mtt.actions.MttActionsRegistry.findMttActionClassForType(data["type"]) : null;
        if (aclazz != null) {
            this.__setType(data["type"], aclazz);
        } else {
            qx.event.Timer.once(function () {
                this.__selectType();
            }, this, 0);
        }
    },

    members: {

        __ruleId: null,

        __data: null,

        __form: null,

        __typeEditorStack: null,

        __selectType: function () {
            var dlg = new ncms.mtt.actions.MttActionTypeSelectorDlg();
            dlg.addListenerOnce("completed", function (ev) {
                var data = ev.getData();
                dlg.destroy();
                //Data: [type, editor_clazz]
                this.__setType(data[0], data[1]);
            }, this);
            dlg.show();
        },

        __setType: function (type, clazz) {
            var items = this.__form.getItems();
            items["type"].setValue(type + " | " + clazz.getDescription());
            this.__typeEditorStack.showWidget(clazz.classname);
        },

        __ok: function () {
            if (!this.__form.validate()) {
                return;
            }
            var w = this.__typeEditorStack.getActiveWidget();
            if (w == null) {
                return;
            }
            var editor = w.getUserData("editor");
            if (editor == null) {
                return;
            }
            var spec = editor.asSpec(w);
            if (spec == null) {
                return;
            }
            var req;
            var items = this.__form.getItems();
            var data = {
                type: editor.constructor.getType(),
                description: items["description"].getValue(),
                enabled: items["enabled"].getValue(),
                groupId: this.__data["groupId"],
                spec: (typeof spec === "string") ? spec : JSON.stringify(spec)
            };
            if (this.__data["id"] == null) {
                req = new sm.io.Request(
                    ncms.Application.ACT.getRestUrl("mtt.action.new", {id: this.__ruleId}),
                    "PUT", "application/json");
            } else {
                req = new sm.io.Request(
                    ncms.Application.ACT.getRestUrl("mtt.action.update", {id: this.__data["id"]}),
                    "POST", "application/json");
            }
            req.setRequestContentType("application/json");
            req.setData(JSON.stringify(data));
            req.send(function (resp) {
                var data = resp.getContent();
                qx.core.Assert.assertObject(data);
                this.fireDataEvent("completed", data);
            }, this);
        },

        __createTypeWidgetStack: function () {
            var ts = new sm.ui.cont.LazyStack();
            ts.setWidgetsHidePolicy("exclude");
            var me = this;
            ts.setOnDemandFactoryFunctionProvider(function () {
                return function (id) {
                    var editor = ncms.mtt.actions.MttActionsRegistry.createMttActionInstance(id);
                    var spec = me.__data["spec"];
                    var w = editor.createWidget(spec || {}, me.__ruleId, me.__data["id"]);
                    if (w == null) {
                        w = new qx.ui.core.Widget();
                    }
                    w.setUserData("editor", editor);
                    return w;
                }
            });
            return ts;
        },

        close: function () {
            this.base(arguments);
            this.destroy();
        }
    },

    destruct: function () {
        this.__ruleId = null;
        this.__data = null;
        this.__typeEditorStack = null;
        this._disposeObjects("__form");
    }
});