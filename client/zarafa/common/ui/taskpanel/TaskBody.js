Ext.namespace('Zarafa.common.ui.taskpanel');

/**
 * @class Zarafa.common.ui.taskpanel.TaskBody
 * @extends Ext.form.FormPanel
 * @xtype zarafa.taskbody
 */
Zarafa.common.ui.taskpanel.TaskBody = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Ext.Template/String} headerTemplate The template or template string which
	 * must be applied to the {@link #header} when the {@link Zarafa.core.data.IPMRecord record}
	 * has been {@link #update updated}. The arguments of this template will be the
	 * {@link Zarafa.core.data.IPMRecord#data record.data} field.
	 */
	headerTemplate :
		'<div class="preview-header-titlebox">' +
			'<tpl if="!Ext.isEmpty(values.subject)">' +
				'<span class="preview-title">{subject:htmlEncode}</span>' +
			'</tpl>' +
		'</div>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.taskbody',
			border : false,
			header :  true,
			unstyled : true,
			autoWidth : true,
			headerCfg : {
				cls : 'preview-header-title'
			},
			items : [{
				xtype:'fieldset',
				title: 'Task',
				items : [{
					xtype : 'displayfield',
					fieldLabel : _('Subject'),
					name : 'subject'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Start Date'),
					ref : '../startDate'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('End Date'),
					ref : '../endDate'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Status'),
					ref : '../taskStatusPreview',
					name : 'status'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Priority'),
					ref : '../taskImportancePreview',
					name : 'importance'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('% Complete'),
					name : 'percent_complete'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Owner'),
					name : 'owner'
				}]
			}, {
				xtype:'fieldset',
				title: 'Details',
				items : [{
					xtype : 'displayfield',
					fieldLabel : _('Date Complete'),
					name : 'date_completed'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Total Work'),
					name : 'totalwork'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Actual Work'),
					name : 'actualwork'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Mileage'),
					name : 'mileage'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Billing Information'),
					name : 'billing_information'
				}, {
					xtype : 'displayfield',
					fieldLabel : _('Companies'),
					name : 'companies'
				}]
			}]
		});

		Zarafa.common.ui.taskpanel.TaskBody.superclass.constructor.call(this, config);

		if (Ext.isString(this.headerTemplate)) {
			this.headerTemplate = new Ext.XTemplate(this.headerTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Updates the container by loading data from the record data into the {@link #template}
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the header panel with
	 */
	update: function(record)
	{
		this.record = record;

		this.getForm().loadRecord(record);

		if (Ext.isDefined(record)) {
			this.headerTemplate.overwrite(this.header.dom, record.data);
		} else {
			this.header.dom.innerHTML = '';
		}

		this.taskStatusPreview.setValue(Zarafa.core.mapi.TaskStatus.getDisplayName(record.get('status')));
		this.taskImportancePreview.setValue(Zarafa.core.mapi.Importance.getDisplayName(record.get('importance')));

		var startDate = record.get('startdate');
		var startDateUpdate = false;
		if (Ext.isDate(startDate)) {
			startDate = startDate.toUTC(); // The startdate is an UTC representation
			this.startDate.setValue(startDate);
		}

		var dueDate = record.get('duedate');
		var dueDateUpdate = false;
		if (Ext.isDate(dueDate)) {
			dueDate = dueDate.toUTC(); // The duedate is an UTC representation
			this.endDate.setValue(dueDate);
		}
	}
});

Ext.reg('zarafa.taskbody', Zarafa.common.ui.taskpanel.TaskBody);