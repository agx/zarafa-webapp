Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchResultPreviewPanel
 * @extends Zarafa.core.ui.PreviewPanel
 * @xtype zarafa.searchresultpreviewpanel
 */
Zarafa.advancesearch.ui.SearchResultPreviewPanel = Ext.extend(Zarafa.core.ui.PreviewPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure.
	 */
	constructor: function (config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.searchresultpreviewpanel',
			cls: 'zarafa-previewpanel zarafa-context-mainpanel',
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				// Defer loading mail immediately, because the user
				// might be quickly clicking through the list of mails.
				enableOpenLoadTask: true,
				autoOpenLoadTaskDefer: 250
			}),
			width: 600,
			height: 400,
			/*
			 * TODO : make this code common for the Zarafa.advancesearch.ui.SearchResultPreviewPanel,
			 * Zarafa.mail.ui.MailPreviewPanel and Zarafa.advancesearch.dialogs.SearchToolbarPanel
			 */
			tbar : {
				height : 33,
				items : [{
					xtype: 'button',
					tooltip: _('Reply') + ' (Ctrl + R)',
					overflowText: _('Reply'),
					iconCls: 'icon_replyEmail',
					ref: 'replyBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLY,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Reply All') + ' (Ctrl + Alt + R)',
					overflowText: _('Reply All'),
					iconCls: 'icon_replyAllEmail',
					ref: 'replyAllBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLYALL,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Forward') + ' (Ctrl + F)',
					overflowText: _('Forward'),
					iconCls: 'icon_forwardEmail',
					ref: 'forwardBtn',
					responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Edit as New Message') + ' (Ctrl + E)',
					overflowText: _('Edit as New Message'),
					iconCls: 'icon_editAsNewEmail',
					ref: 'editAsNewBtn',
					responseMode: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
					handler: this.onResponse,
					scope : this
				}]
			}
		});

		this.addEvents([
			/**
			 * @event afterupdatesearchpreviewpanel
			 * Fired when {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
			 * gets update.
			 * @param {Zarafa.advancesearch.ui.SearchResultPreviewPanel} SearchResultPreviewPanel The SearchResultPreviewPanel which fired the event
			 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
			 * @param {Boolean} contentReset force the component to perform a full update of the data.
			 */
			'afterupdatesearchpreviewpanel'
		]);

		Zarafa.advancesearch.ui.SearchResultPreviewPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function (record, contentReset)
	{
		Zarafa.advancesearch.ui.SearchResultPreviewPanel.superclass.update.apply(this, arguments);

		this.fireEvent('afterupdatesearchpreviewpanel', this, record, contentReset);

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var isMessageReplyable = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM', 'IPM.SCHEDULE', 'IPM.APPOINTMENT']);

			// Additional check when the message is IPM.Appointment and not a meeting request
			// but a simple appointment which can not be replied as there is no reply-to recipients available.
			if(isMessageReplyable && Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.APPOINTMENT'])) {
				if(!record.isMeeting()){
					isMessageReplyable = false;
				}
			}

			var toolbar = this.getTopToolbar();

			toolbar.replyBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			toolbar.replyAllBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			toolbar.forwardBtn.setVisible(!isFaultyMessage && isMessageReplyable);

			// Only show the "Edit as New Message" button in the toolbar when the item is in the Sent folder
			var defaultFolder = this.model.getDefaultFolder();
			toolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey()==='sent' && !isFaultyMessage && isMessageReplyable);
		}
	},

	/**
	 * See {@link Zarafa.core.plugins.RecordComponentPlugin#setRecord}. also it will
	 * disable the toolbar if {@link Zarafa.common.data.ViewModes#RIGHT_PREVIEW} else it will show the toolbar
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to set
	 */
	setRecord : function(record)
	{
		for (var i = 0; i < this.toolbars.length; i++) {
			if(this.context.getCurrentViewMode() === Zarafa.common.data.ViewModes.RIGHT_PREVIEW) {
				this.toolbars[i].setVisible(false);
			} else {
				this.toolbars[i].setVisible(!!record);
			}
		}

		if (this.recordComponentPlugin) {
			this.recordComponentPlugin.setRecord(record);
		}
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New Message" menuitems are clicked.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse : function(button)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, mailContextModel, button.responseMode);
	}
});

Ext.reg('zarafa.searchresultpreviewpanel', Zarafa.advancesearch.ui.SearchResultPreviewPanel);

