Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchGrid
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.searchgrid
 */
Zarafa.advancesearch.ui.SearchGrid = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.advancesearch.AdvanceSearchContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.advancesearch.AdvanceSearchContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.advancesearch.AdvanceSearchContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		if (!Ext.isDefined(config.advanceSearchStore) && Ext.isDefined(config.model)) {
			config.store = config.model.store;
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		Ext.applyIf(config, {
			xtype: 'zarafa.searchgrid',
			cls: 'zarafa-searchgrid',
			border : false,
			// Don't make the search grid stateful. By default we always want ZCP to sort new search results on relevance.
			stateful : false,
			statefulRelativeDimensions : false,
			loadMask : this.initLoadMask(),
			sm : this.initSelectionModel(),
			cm : new Zarafa.advancesearch.ui.SearchGridColumnModel({
				grid: this,
				folder : config.model.getDefaultFolder()
			}),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem',
			viewConfig : this.initViewConfig(),
			enableColumnHide: false,
			enableColumnMove: false,
			enableColumnResize: false,
			enableHdMenu: false,
			autoExpandMin : 200,
			// The maximum number of records that the store can hold and still be sortable
			//TODO: This value should probably be configurable, but let's not do that until we are absolutely sure
			// about doing the sorting this way.
			sortableRecordsMax : 500
		});

		Zarafa.advancesearch.ui.SearchGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.advancesearch.ui.SearchGrid.superclass.initEvents.call(this);

		this.on({
			'cellclick': this.onCellClick,
			'rowcontextmenu': this.onRowContextMenu,
			'rowdblclick': this.onRowDblClick,
			scope : this
		});

		this.mon(this.getView(), 'livescrollstart', this.onLiveScrollStart, this);
		this.mon(this.getView(), 'beforesort', this.onBeforeSort, this);

		// Add a buffer to the following 2 event handlers. These are influenced by Extjs when a record
		// is removed from the store. However removing of records isn't performed in batches. This means
		// that we need to offload the event handlers attached to removing of records in case that
		// a large batch of records is being removed.
		this.mon(this.getSelectionModel(), 'rowselect', this.onRowSelect, this, { buffer : 1 });
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this, { buffer : 1 });

		this.mon(this.model, 'recordselectionchange', this.onRecordSelectionChange, this);
		this.mon(this.model, 'searchstop', this.onSearchStop, this);

		this.mon(this.context, 'viewchange', this.onContextViewChange, this);
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading Search results') + '...'
		};
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field
	 *
	 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Zarafa.advancesearch.ui.AdvanceSearchRowSelectionModel({
			singleSelect : false
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel#viewConfig} field
	 *
	 * @return {Ext.grid.GridView} The configuration object for {@link Ext.grid.GridView}
	 * @private
	 */
	initViewConfig : function()
	{
		return {
			getRowClass : this.viewConfigGetRowClass,

			// We need a rowselector depth of 15 because of the nested
			// table in the rowBody.
			rowSelectorDepth : 15
		};
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Read/Unread style to the entire row. 
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass : function(record, rowIndex, rowParams, store)
	{
		var cssClass = (Ext.isFunction(record.isRead) && !record.isRead() ? 'mail_unread' : 'mail_read');

		return 'x-grid3-row-collapsed ' + cssClass;
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.common.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.common.data.Views} oldView The ID of the previously selected view.
	 */
	onContextViewChange : function(context, newView, oldView)
	{
		if(oldView === Zarafa.common.data.Views.LIVESCROLL) {
			this.getView().resetScroll();
		}
	},

	/**
	 * Raw click event handler for the entire grid.
	 * Toggles the unread/read status when a user clicks on the
	 * mail icon of a message.
	 * 
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid the grid
	 * @param {Number} rowIndex The index of the clicked row
	 * @param {Number} columnIndex The column index of the clicked row
	 * @param {Ext.EventObject} e The click eventobject
	 */
	onCellClick : function(grid, rowIndex, columnIndex, e)
	{
		var record = this.store.getAt(rowIndex);
		if (!Ext.isDefined(record) || record.get('message_class') != 'IPM.Note')
			return;

		Zarafa.common.Actions.markAsRead(record, !record.isRead());
	},

	/**
	 * Event handler which is triggered when the user opems the context menu.
	 *
	 * There are some selection rules regarding the context menu. If no rows where
	 * selected, the row on which the context menu was requested will be marked
	 * as selected. If there have been rows selected, but the context menu was
	 * requested on a different row, then the old selection is lost, and the new
	 * row will be selected. If the row on which the context menu was selected is
	 * part of the previously selected rows, then the context menu will be applied
	 * to all selected rows.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		var sm = this.getSelectionModel();
		var cm = this.getColumnModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}
		
		var records = sm.getSelections();

		Zarafa.core.data.UIFactory.openDefaultContextMenu(records, { position : event.getXY(), context : this.context });
	},

	/**
	 * Event handler which is triggered when the user double-clicks on a particular item in the
	 * grid. This will open a contentpanel which contains the selected item.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid The Grid on which the user double-clicked
	 * @param {Number} rowIndex The Row number on which was double-clicked.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, e)
	{
		Zarafa.common.Actions.openMessageContent(this.getSelectionModel().getSelected());
	},

	/**
	 * Event handler which is trigggerd when the user selects a row from the {@link Ext.grid.GridPanel}.
	 * This will updates the {@link Zarafa.advancesearch.AdvanceSearchContextModel AdvanceSearchContextModel} with the record which
	 * was selected in the grid for preview
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @param {Integer} rowNumber The row number which is selected in the selection model
	 * @param {Ext.data.Record} record The record which is selected for preview.
	 * @private
	 */
	onRowSelect : function(selectionModel, rowNumber, record)
	{
		var count = selectionModel.getCount();

		if (count === 0) {
			this.model.setPreviewRecord(undefined);
		} else if (count == 1 && selectionModel.getSelected() === record) {
			this.model.setPreviewRecord(record);
		}
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.advancesearch.ui.SearchGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.advancesearch.AdvanceSearchContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		var selections = selectionModel.getSelections();

		this.model.setSelectedRecords(selections);
		if (Ext.isEmpty(selections)) {
			this.model.setPreviewRecord(undefined);
		}
	},

	/**
	 * Event handler which is fired when the recordselection in the {@link #model} has been changed.
	 * If no selection is currently active, this will automatically select the given records in the grid.
	 *
	 * @param {Zarafa.core.ContextModel} model this model.
	 * @param {Zarafa.core.data.IPMRecord[]} records The selected records
	 * @private
	 */
	onRecordSelectionChange : function(model, records)
	{
		if (!this.getSelectionModel().hasSelection() && !Ext.isEmpty(records)) {
			var index = model.getStore().indexOf(records[0]);
			this.getSelectionModel().selectRecords(records);
			this.getView().focusRow(index);
		}
	},

	/**
	 * Event handler which triggered when scrollbar gets scrolled more then 90% of it`s height.
	 * it will be used to start live scroll on {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
	 * also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated batch of search result status.
	 * 
	 * @param {Number} cursor the cursor contains the last index of record in grid.
	 * @private
	 */
	onLiveScrollStart : function(cursor)
	{
		this.model.startLiveScroll(cursor);
	},

	/**
	 * Event handler which triggered when header of grid was clicked to apply the sorting
	 * on {@link Zarafa.advancesearch.ui.SearchGrid search grid}. it will first stop the 
	 * {@link Zarafa.core.ContextModel#stopLiveScroll live scroll} and then apply the sorting.
	 * @param {Ext.grid.GridView} gridView The GridView of the grid panel
	 * @private
	 */
	onBeforeSort : function(gridView)
	{
		// Only check when sorting on the second row, because the first row does not have sorting enabled
		if ( gridView.activeHdIndex === 1 ){

			// Check if the total number of results is less then the maximum for which we will enable sorting
			var store = this.getStore();
			var recordTotalCount = store.getTotalCount();
			if ( recordTotalCount >= this.sortableRecordsMax ){
				Zarafa.common.dialogs.MessageBox.alert(
					_('Sorting not possible'), 
					String.format(_('The search results could not be sorted because the number of items is higher than {0}. Narrow down your results by specifying your input.'), this.sortableRecordsMax));
				return false;
			}

			// Stop the infinite scrolling if it is running
			this.model.stopLiveScroll();

			// Because we are sorting on the searchdate property and this property is added in the frontend
			// we cannot do remote sorting and will change to local sorting
			store.remoteSort = false;
			
			// Reset the page size so the pagination toolbar (if shown) will show all results in one page.
			var pagesToolbar = this.dialog.findByType('zarafa.paging')[0];
			pagesToolbar.pageSize = this.sortableRecordsMax;
			
			var loadedRecordCount = store.getCount();

			// If necessary we must first load all records from the store before we can do the sorting
			if (loadedRecordCount < recordTotalCount){
				
				// cancel pending load request when sorting is started.
				// NOTE: 'updatelist' is already handled when we stop infinite scroll
				if (store.isExecuting('list')) {
					store.proxy.cancelRequests('list');
				}

				// Set the options for the load request
				var options = {
					actionType : Zarafa.core.Actions['list'],
					folder: this.model.getFolders()[0],
					params: {
						restriction: {
							start: 0,
							limit: recordTotalCount
						}
					},
					callback: function(){
						// Do the sorting again, because Ext tried to do the sorting before we reloaded
						store.sort(store.sortInfo.field, store.sortInfo.direction);
					}
				};
				store.load(options);
			}
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.ContextModel#searchstop searchstop} event.
	 * This will {@link Zarafa.common.ui.LoadMask#hide hide} the {@link Zarafa.common.ui.LoadMask loadmask}, if any.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop : function(model)
	{
		this.loadMask.hide();
	}
});

Ext.reg('zarafa.searchgrid', Zarafa.advancesearch.ui.SearchGrid);
