/**
 * MttFilter interface
 */
qx.Interface.define("ncms.mtt.filters.IMttFilter", {

//   statics : {
//
//        /**
//         * Returns short human readable filter description.
//         * @return {String}
//         */
//        getDescription : function() {
//        },
//
//        /**
//         * Returns a filter type
//         * @return {String}
//         */
//        getType : function() {
//        },
//
//        /**
//         * Convert filter specification to human readable string.
//         * @param spec {Object}
//         */
//         specForHuman: function (spec) {
//         }
//    },

    members: {

        /**
         * Activate filter options widget
         * @param spec {Object} Filter specification
         */
        createWidget: function (spec) {
        },

        /**
         * Return filter specification JSON object
         * @param widget {qx.ui.core.Widget} Filter widget created by `createWidget`
         */
        asSpec: function (widget) {
            this.assertNotNull(widget);
        }
    }
});