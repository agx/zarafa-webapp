 Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.ContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.hierarchycontextmenu
 */
Zarafa.hierarchy.ui.ContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	
	/**
	 * @cfg contextNode Holds {@link Zarafa.hierarchy.ui.FolderNode foldernode} on which 'contextmenu' event has occured
	 */
	contextNode : undefined,

	/**
	 * The tree to which the {@link #contextNode} belongs to. On this tree the actual contextmenu was requested.
	 * @property
	 * @type Zarafa.hierarchy.ui.Tree
	 */
	contextTree : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (config.contextNode) {
			config.contextTree = config.contextNode.getOwnerTree();
		}

		Ext.applyIf(config, {
			items : [
				this.createContextMenuItems(config)
			],
			defaults : {
				xtype: 'zarafa.conditionalitem',
				scope : this
			}
		});
	
		Zarafa.hierarchy.ui.ContextMenu.superclass.constructor.call(this, config);
	},
	
	/**
	 * Create the Action context menu items.
	 * @param {Object} config Configuration object for the {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Action context menu items
	 * @private
	 *
	 * Note: All handlers are called within the scope of {@link Zarafa.hierarchy.ui.ContextMenu HierarchyContextMenu}
	 */
	createContextMenuItems : function(config)
	{
		return [{
			text : _('Open'),
			iconCls : 'icon_open',
			handler : this.onContextItemOpen,
			beforeShow : function(item, record) {
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_READ;
				if (!access || (record.isIPMSubTree() && !record.getMAPIStore().isDefaultStore())) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text : _('Copy/Move Folder'),
			iconCls : 'icon_copy',
			handler : this.onContextCopyMoveFolder,
			beforeShow : function(item, record) {
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_READ;
				if (!access || record.isIPMSubTree() || record.isRSSFolder() || record.isDefaultFolder()) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			text : _('Rename Folder'),
			iconCls : 'icon_folder_rename',
			handler : this.onContextItemRenameFolder,
			beforeShow : function(item, record) {
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_MODIFY;
				if (!access || record.isIPMSubTree() || record.isRSSFolder() || record.isDefaultFolder() || !this.contextTree || !this.contextNode) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			text : _('New Folder'),
			iconCls : 'icon_createFolderColor',
			handler : this.onContextItemNewFolder,
			beforeShow : function(item, record) {
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_CREATE_HIERARCHY;
				if (!access || record.getMAPIStore().isArchiveStore()) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text : _('Mark All Messages Read'),
			iconCls : 'icon_mark_all_read',
			handler : this.onContextItemReadFlags,
			beforeShow : function(item, record) {
				// We're not modifying the folder, but the contents. Hence we request the READ access
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_READ;
				if (!access || record.isIPMSubTree()) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text : _('Delete Folder'),
			iconCls : 'icon_folder_delete',
			handler : this.onContextItemDeleteFolder,
			beforeShow : function(item, record) {
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_DELETE;
				if (!access || record.isIPMSubTree() || record.isDefaultFolder() || record.isRSSFolder() || record.getMAPIStore().isArchiveStore()) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			text : _('Empty folder'),
			iconCls : 'icon_empty_trash',
			handler : this.onContextItemEmptyFolder,
			beforeShow : function(item, record) {
				// We're not modifying the folder, but the contents. Hence we request the READ access
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_READ;
				if (access && record.isSpecialFolder('wastebasket') || record.isSpecialFolder('junk')) {
					item.setDisabled(false);
				} else {
					item.setDisabled(true);
				}
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text : _('Add to favorites folder'),
			iconCls : 'icon_folder_add_favorite',
			beforeShow : function(item, record) {
				// hide add to favorites button, as functionality still not implemented 
				var access = record.get('access') & Zarafa.core.mapi.Access.ACCESS_READ;
				if (false && access && record.getMAPIStore().isPublicStore() && !record.isFavoriteFolder() && !Zarafa.core.EntryId.isFavoriteFolder(record.get('entryid'))) {
					item.setDisabled(false);
				} else { 
					item.setDisabled(true);
				}
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text : _('Close store'),
			iconCls : 'icon_store_close',
			handler : this.onContextItemCloseStore,
			scope : this,
			beforeShow : function(item, record) {
				if (record.isIPMSubTree() && record.getMAPIStore().isSharedStore()) {
					item.setDisabled(false);
				} else {
					item.setDisabled(true);
				}
			}
		}, {
			text : _('Close folder'),
			iconCls : 'icon_folder_close',
			handler : this.onContextItemCloseFolder,
			scope : this,
			beforeShow : function(item, record) {
				if (!record.isIPMSubTree() && record.isSharedFolder()) {
					item.setDisabled(false);
				} else {
					item.setDisabled(true);
				}
			}
		}, {
			xtype: 'menuseparator'
		}, {
			text : _('Reload'),
			iconCls : 'icon-reload',
			handler : this.onContextItemReload,
			scope : this,
			beforeShow : function(item, record) {
				if (record.isOwnRoot()) {
					item.setDisabled(false);
				} else {
					item.setDisabled(true);
				}
			}
		}, {
			text : _('Restore items'),
			handler : this.onContextItemRestore,
			iconCls: 'icon_restore',
			beforeShow : function(item, record) {
				if (!record.get('access')) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}, {
			text : _('Select color'),
			iconCls : 'icon-select-color',
			beforeShow : function(item, record) {
				var folderEntryId = this.contextNode.id;
				var contextModel = this.contextTree.model;
				if (!this.contextTree.colored || !Ext.isDefined(contextModel)) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
					
					// Store the color of the chosen color scheme, so we can use it later 
					// to build a icon (more precisely just a div with a background color)
					// in the context menu
					var colorScheme = contextModel.getColorScheme(folderEntryId);
					item.iconBG = colorScheme.base;
				}
			},
			menu : this.createSelectColorSubmenu(config)
		}, {
			text : _('Properties'),
			handler : this.onContextItemProperties,
			iconCls : 'icon_openMessageOptions',
			beforeShow : function(item, record) {
				if (!record.get('access')) {
					item.setDisabled(true);
				} else {
					item.setDisabled(false);
				}
			}
		}];
	},
	
	/**
	 * Creates the submenu for the color select menu item
	 * Because this function is called before the parent constructor
	 * is called, the configuration properties are not yet set and
	 * we must get them from the passed configuration object
	 * 
	 * @param {Object} config Configuration object for the {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * @return {Object[]} An array with configuration objects for 
	 * {@link Zarafa.core.ui.menu.ConditionalItem menu items}
	 * @private 
	 */
	createSelectColorSubmenu : function(config)
	{
		var items = [];
		var contextModel = config.contextTree.model;
		if ( !contextModel ){
			return items;
		}
		var colorSchemes = contextModel.colorScheme;
		var folderNodeColorTheme = config.contextNode.getFolder().colorTheme;
		Ext.each(colorSchemes, function(colorScheme){
			items.push({
				xtype: 'zarafa.conditionalitem',
				text : colorScheme.displayName,
				ctCls : folderNodeColorTheme===colorScheme.name ? 'x-menu-item-selected':'',
				iconCls : 'icon-select-color color-'+colorScheme.name,
				colorSchemeName : colorScheme.name,
				handler : this.onContextItemSelectColor.createDelegate(this),
				iconBG : colorScheme.header
			});
		}, this);
		
		return items;
	},

	/**
	 * Fires on selecting 'Open' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * @private
	 */
	onContextItemOpen : function()
	{
		// Select node within tree
		if (this.contextTree) {
			this.contextTree.selectFolderInTree(this.records);
		}
		Zarafa.hierarchy.Actions.openFolder(this.records);
	},

	/**
	 * Fires on selecting 'Copy/Move Folder' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Opens {@link Zarafa.common.dialogs.CopyMoveContent CopyMoveContent} which copies or moves the folder in the Hierarchy
	 * @private
	 */
	onContextCopyMoveFolder : function()
	{
		Zarafa.common.Actions.openCopyMoveContent(this.records);
	},

	/**
	 * Fires on selecting 'Rename' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Opens editor in tree to rename node.
	 * @private
	 */
	onContextItemRenameFolder : function()
	{
		this.contextTree.startEditingNode(this.contextNode);
	},

	/**
	 * Fires on selecting 'New Folder' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Opens {@link Zarafa.common.dialogs.CreateFolderContent CreateFolderContent} which adds new folder to Hierarchy
	 * @private
	 */
	onContextItemNewFolder : function()
	{
		Zarafa.hierarchy.Actions.openCreateFolderContent(this.records);
	},

	/**
	 * Fires on selecting 'Delete Folder' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Asks user to confirm deletion of folder and if true then calls {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore}
	 * to delete folder.
	 * @private
	 */
	onContextItemDeleteFolder : function()
	{
		var isFolderDeleted = this.records.isInDeletedItems() || this.records.getMAPIStore().isPublicStore();

		if (isFolderDeleted)
			var msg = String.format(_('Are you sure you want to permanently delete all the items and subfolders in the "{0}" folder?'), Ext.util.Format.htmlEncode(this.records.getDisplayName()));
		else
			var msg = String.format(_('Are you sure you want to delete the folder "{0}" and move all of its contents into the Deleted Items folder?'), Ext.util.Format.htmlEncode(this.records.getDisplayName()));

		Ext.MessageBox.confirm(
			_('Zarafa WebApp'),
			msg,
			function (buttonClicked) {
				if (buttonClicked == 'yes') {
					var store = this.records.getStore();

					if (isFolderDeleted) {
						store.remove(this.records);
					} else {
						this.records.moveTo(container.getHierarchyStore().getDefaultFolder('wastebasket'));
					}

					store.save(this.records);
				}
			},
			this);
	},

	/**
	 * Fires on selecting 'Emtpy Folder' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Asks user to confirm deletion of all contents of selected folder and if true then calls {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore}
	 * to empty that folder.
	 * @private
	 */
	onContextItemEmptyFolder : function()
	{
		Ext.MessageBox.confirm(
			_('Zarafa WebApp'),
			String.format(_('Are you sure you want to empty {0}?'), Ext.util.Format.htmlEncode(this.records.getDisplayName())),
			function (buttonClicked) {
				if (buttonClicked == 'yes') {
					this.records.emptyFolder();
					this.records.save();
				}
			},
			this);
	},

	/**
	 * Fires on selecting 'Mark All msgs as read' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Asks {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} to mark all messages on the selected folder as read.
	 * @private
	 */
	onContextItemReadFlags : function()
	{
		this.records.seadReadFlags();
		this.records.save();
	},

	/**
	 * Fires when a color is selected from the {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Saves the new color to the settings and calls doLayout on the context to re-render.
	 * 
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The menu item that was clicked on
	 */
	onContextItemSelectColor : function(item)
	{
		var contextModel = this.contextTree.model;
		var folder = item.getRecords();
		var store = contextModel.getStore();
		
		// Find the color scheme of the chosen color
		var colorSchemeName = item.colorSchemeName;
		var colorScheme = Zarafa.core.ColorSchemes.getColorScheme(colorSchemeName);
		
		// And set the color scheme for this folder
		contextModel.setColorScheme(folder.get('entryid'), colorScheme);

		// Update the colors of the Color Indicator in hierarchy tree
		var treeNodeui = this.contextNode.getUI();
		if (treeNodeui.colorIndicator) {
			treeNodeui.colorIndicator.style.backgroundColor = colorScheme.base;
		}

		// Update the colors of the hierarchy tree
		this.contextTree.updateAll();

		// Now let's repaint the calendar view by sending a 'fake' load event for the store.
		if (store && store.lastOptions && !store.isExecuting('list')) {
			store.fireEvent('load', store, store.getRange(), store.lastOptions);
		}
	},
	
	/**
	 * Fires on selecting 'Properties' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Opens {@link Zarafa.hierarchy.dialogs.FolderPropertiesContent FolderPropertiesContent}
	 * @private
	 */
	onContextItemProperties : function()
	{
		Zarafa.hierarchy.Actions.openFolderPropertiesContent(this.records);
	},

	/**
	 * Fires on selecting "Close Store" menu option from the contextmenu. This
	 * will remove the shared store from the settings and closes the store on the server.
	 * @private
	 */
	onContextItemCloseStore : function()
	{
		var store = container.getHierarchyStore();
		var mapistore = this.records.getMAPIStore();

		store.remove(mapistore);
		store.save(mapistore);
	},

	/**
	 * Fires on selecting "Close Folder" menu option from the contextmenu. This
	 * will remove the shared folder from the settings and closes the folder on the server.
	 * @private
	 */
	onContextItemCloseFolder : function()
	{
		var mapistore = this.records.getMAPIStore();
		var folderstore = mapistore.getFolderStore();

		folderstore.remove(this.records);
		folderstore.save(this.records);
	},

	/**
	 * Fires on selecting 'Reload' menu option from {@link Zarafa.hierarchy.ui.ContextMenu ContextMenu}
	 * Reloads {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} and populates new data in {@link Zarafa.hierarchy.ui.Tree Tree}.
	 * @private
	 */
	onContextItemReload : function()
	{
		container.getHierarchyStore().reload();
	},

	/**
	 * Open Restore dialog for restoring previously deleted items.
	 * @private
	 */
	onContextItemRestore : function()
	{
		Zarafa.common.Actions.openRestoreContent(this.records);
	}
});

Ext.reg('zarafa.hierarchycontextmenu', Zarafa.hierarchy.ui.ContextMenu);
