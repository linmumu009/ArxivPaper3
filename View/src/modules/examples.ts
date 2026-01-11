import { getLocaleID, getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id }) => {
        if (id === addon.data.config.addonID)
          this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: addon.data.config.addonID,
      src: rootURI + "content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
    });
  }
}

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    // Register an event key for Alt+L
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log(ev, keyOptions.keyboard);
      if (keyOptions.keyboard?.equals("shift,l")) {
        addon.hooks.onShortcuts("larger");
      }
      if (ev.shiftKey && ev.key === "S") {
        addon.hooks.onShortcuts("smaller");
      }
    });

    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Example Shortcuts: Alt+L/S/C",
        type: "success",
      })
      .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutSmallerCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Smaller!",
        type: "default",
      })
      .show();
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet(win: _ZoteroTypes.MainWindow) {
    const doc = win.document;
    const styles = ztoolkit.UI.createElement(doc, "link", {
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${addon.data.config.addonRef}/content/zoteroPane.css`,
      },
    });
    doc.documentElement?.appendChild(styles);
    doc.getElementById("zotero-item-pane-content")?.classList.add("makeItRed");
  }



  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ztoolkit.Menu.register("menuFile", {
      tag: "menuitem",
      label: getString("menuitem-filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  @example
  static async registerExtraColumn() {
    const field = "test1";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: field,
      label: "text column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      iconPath: "chrome://zotero/skin/cross.png",
    });
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    const field = "test2";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: field,
      label: "custom column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      renderCell(index, data, column, isFirstColumn, doc) {
        ztoolkit.log("Custom column cell is rendered!");
        const span = doc.createElement("span");
        span.className = `cell ${column.className}`;
        span.style.background = "#0dd068";
        span.innerText = "⭐" + data;
        return span;
      },
    });
  }

  @example
  static registerItemPaneCustomInfoRow() {
    Zotero.ItemPaneManager.registerInfoRow({
      rowID: "example",
      pluginID: addon.data.config.addonID,
      editable: true,
      label: {
        l10nID: getLocaleID("item-info-row-example-label"),
      },
      position: "afterCreators",
      onGetData: ({ item }) => {
        return item.getField("title");
      },
      onSetData: ({ item, value }) => {
        item.setField("title", value);
      },
    });
  }

  @example
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "example",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example1-head-text"),
        icon: "chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example1-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/save.svg",
      },
      onRender: ({ body, item, editable, tabType }) => {
        body.innerHTML = "";
        const doc = body.ownerDocument as Document;
        
        const container = doc.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.height = "100%";
        body.appendChild(container);

        const footer = doc.createElement("div");
        footer.style.padding = "16px 8px 32px 8px";
        footer.style.borderBottom = "4px solid #444";
        footer.style.marginBottom = "16px";
        footer.style.display = "flex";
        footer.style.alignItems = "center";
        footer.style.gap = "8px";

        const label = doc.createElement("label");
        label.textContent = "Model:";
        footer.appendChild(label);

        const select = doc.createElement("select");
        select.style.flex = "1";
        select.style.height = "30px";
        select.style.paddingLeft = "4px";
        select.style.textIndent = "4px";
        
        let currentModel = getPref("model" as any) || "";
        let models: string[] = [];
        
        try {
            const savedConfigsStr = getPref("savedConfigs" as any) as string;
            if (savedConfigsStr) {
                 const configs = JSON.parse(savedConfigsStr);
                 if (Array.isArray(configs)) {
                     // Get all model names
                     const rawModels = configs.map((c: any) => c.model?.trim()).filter((m: string) => m);
                     // Remove duplicates while preserving order
                     models = [...new Set(rawModels)];
                 }
            }
        } catch (e) {
            ztoolkit.log("Failed to parse savedConfigs for model list", e);
        }
        
        // If we have valid models from the config
        if (models.length > 0) {
             // If currentModel is invalid (empty or not in the list), default to the last one
             if (!currentModel || !models.includes(currentModel as string)) {
                 currentModel = models[models.length - 1];
                 // Update the preference to reflect the valid choice
                 setPref("model" as any, currentModel);
             }
        } else {
            // If no models available, clear selection
            currentModel = "";
        }

        models.forEach(m => {
          const option = doc.createElement("option");
          option.value = m;
          option.textContent = m;
          if (m === currentModel) option.selected = true;
          select.appendChild(option);
        });

        select.addEventListener("change", (e) => {
          const val = (e.target as HTMLSelectElement).value;
          setPref("model" as any, val);
        });

        footer.appendChild(select);

        // Progress Section
        const progressSection = doc.createElement("div");
        progressSection.style.padding = "16px 8px 8px 8px";
        progressSection.style.borderTop = "4px solid #444";
        progressSection.style.marginTop = "16px";
        progressSection.style.display = "flex";
        progressSection.style.flexDirection = "column";
        progressSection.style.gap = "8px";
        container.appendChild(progressSection);

        // Log Display Area (Create early for reference)
        const logDisplay = doc.createElement("textarea");
        logDisplay.id = "arxiv-paper-progress-log";
        logDisplay.readOnly = true;
        logDisplay.style.width = "100%";
        logDisplay.style.height = "150px";
        logDisplay.style.resize = "vertical";
        logDisplay.style.fontFamily = "monospace";
        logDisplay.style.fontSize = "12px";
        logDisplay.style.padding = "4px";
        logDisplay.style.boxSizing = "border-box";
        logDisplay.style.border = "1px solid #ccc";
        logDisplay.value = "Waiting for process...";

        // Header for Progress Collapse
        const progressHeader = doc.createElement("div");
        progressHeader.style.display = "flex";
        progressHeader.style.justifyContent = "space-between";
        progressHeader.style.alignItems = "center";
        progressHeader.style.cursor = "pointer";
        progressSection.appendChild(progressHeader);

        // Progress Label
        const progressLabel = doc.createElement("label");
        progressLabel.textContent = "Execution Progress";
        progressLabel.style.textAlign = "left";
        progressLabel.style.fontWeight = "bold";
        progressLabel.style.marginBottom = "4px";
        progressLabel.style.cursor = "pointer";
        progressHeader.appendChild(progressLabel);

        // Right Container
        const progressRight = doc.createElement("div");
        progressRight.style.display = "flex";
        progressRight.style.alignItems = "center";
        progressRight.style.gap = "8px";
        progressHeader.appendChild(progressRight);

        // Clear Button
        const clearBtn = doc.createElement("span");
        clearBtn.textContent = "Clear";
        clearBtn.style.fontSize = "11px";
        clearBtn.style.padding = "2px 6px";
        clearBtn.style.border = "1px solid #888";
        clearBtn.style.borderRadius = "3px";
        clearBtn.onclick = (e) => {
             e.stopPropagation();
             logDisplay.value = "";
        };
        progressRight.appendChild(clearBtn);

        const progressArrow = doc.createElement("span");
        progressArrow.textContent = "▼";
        progressRight.appendChild(progressArrow);

        // Progress Content
        const progressContent = doc.createElement("div");
        progressContent.style.display = "flex";
        progressContent.style.flexDirection = "column";
        progressContent.style.gap = "8px";
        progressSection.appendChild(progressContent);
        
        progressContent.appendChild(logDisplay);

        progressHeader.onclick = () => {
            if (progressContent.style.display === "none") {
                progressContent.style.display = "flex";
                progressArrow.textContent = "▼";
            } else {
                progressContent.style.display = "none";
                progressArrow.textContent = "▶";
            }
        };

        // Tags Section
        const tagsSection = doc.createElement("div");
        tagsSection.style.padding = "16px 8px 8px 8px";
        tagsSection.style.borderTop = "4px solid #444";
        tagsSection.style.marginTop = "16px";
        tagsSection.style.display = "flex";
        tagsSection.style.flexDirection = "column";
        tagsSection.style.gap = "8px";
        container.appendChild(tagsSection);

        // Header for Collapse
        const tagsHeader = doc.createElement("div");
        tagsHeader.style.display = "flex";
        tagsHeader.style.justifyContent = "space-between";
        tagsHeader.style.alignItems = "center";
        tagsHeader.style.cursor = "pointer";
        tagsSection.appendChild(tagsHeader);

        // Arxiv Class Label
        const tagsLabel = doc.createElement("label");
        tagsLabel.textContent = "Arxiv Class";
        tagsLabel.style.textAlign = "left";
        tagsLabel.style.fontWeight = "bold";
        tagsLabel.style.marginBottom = "4px";
        tagsLabel.style.cursor = "pointer";
        tagsHeader.appendChild(tagsLabel);

        const tagsArrow = doc.createElement("span");
        tagsArrow.textContent = "▼";
        tagsHeader.appendChild(tagsArrow);

        // Content Container
        const tagsContent = doc.createElement("div");
        tagsContent.style.display = "flex";
        tagsContent.style.flexDirection = "column";
        tagsContent.style.gap = "8px";
        tagsSection.appendChild(tagsContent);

        tagsHeader.onclick = () => {
            if (tagsContent.style.display === "none") {
                tagsContent.style.display = "flex";
                tagsArrow.textContent = "▼";
            } else {
                tagsContent.style.display = "none";
                tagsArrow.textContent = "▶";
            }
        };

        // Class List Table
        const classTable = doc.createElement("table");
        classTable.style.width = "100%";
        classTable.style.borderCollapse = "collapse";
        classTable.style.marginBottom = "8px";
        classTable.style.fontSize = "12px";
        
        const thead = doc.createElement("thead");
        const headerRow = doc.createElement("tr");
        ["", "ClassName", "description"].forEach(text => {
            const th = doc.createElement("th");
            th.textContent = text;
            th.style.border = "1px solid #ccc";
            th.style.padding = "4px";
            th.style.textAlign = "left";
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        classTable.appendChild(thead);

        const tbody = doc.createElement("tbody");
        classTable.appendChild(tbody);
        tagsContent.appendChild(classTable);

        // Load saved classes
        const refreshClassList = () => {
            tbody.innerHTML = "";
            let savedClasses: any[] = [];
            try {
                const savedStr = getPref("arxivClasses" as any) as string;
                if (savedStr) savedClasses = JSON.parse(savedStr);
            } catch (e) {
                ztoolkit.log("Error loading arxivClasses", e);
            }
            
            savedClasses.forEach(cls => {
                const tr = doc.createElement("tr");

                const tdCheck = doc.createElement("td");
                tdCheck.style.border = "1px solid #ccc";
                tdCheck.style.padding = "4px";
                tdCheck.style.textAlign = "center";
                tdCheck.style.width = "30px";
                
                const checkbox = doc.createElement("input");
                checkbox.type = "checkbox";
                checkbox.onclick = () => {
                    if (checkbox.checked) {
                        const allChecks = tbody.querySelectorAll("input[type='checkbox']");
                        allChecks.forEach((c: any) => {
                            if (c !== checkbox) c.checked = false;
                        });
                    }
                };
                tdCheck.appendChild(checkbox);
                tr.appendChild(tdCheck);
                
                const tdName = doc.createElement("td");
                tdName.textContent = cls.name;
                tdName.style.border = "1px solid #ccc";
                tdName.style.padding = "4px";
                tr.appendChild(tdName);

                const tdDesc = doc.createElement("td");
                tdDesc.textContent = cls.description;
                tdDesc.style.border = "1px solid #ccc";
                tdDesc.style.padding = "4px";
                tr.appendChild(tdDesc);

                tbody.appendChild(tr);
            });
        };
        refreshClassList();

        // Tags Display
        const tagsDisplay = doc.createElement("div");
        tagsDisplay.style.border = "1px solid #ddd";
        tagsDisplay.style.borderRadius = "4px";
        tagsDisplay.style.minHeight = "60px";
        tagsDisplay.style.padding = "4px";
        tagsDisplay.style.display = "flex";
        tagsDisplay.style.flexWrap = "wrap";
        tagsDisplay.style.gap = "4px";
        tagsDisplay.style.alignContent = "flex-start";
        tagsContent.appendChild(tagsDisplay);

        const addTagToUI = (text: string) => {
            const tag = doc.createElement("span");
            tag.style.padding = "2px 6px";
            tag.style.border = "1px solid #ccc";
            tag.style.borderRadius = "4px";
            tag.style.display = "flex";
            tag.style.alignItems = "center";
            tag.style.gap = "4px";
            
            const tagText = doc.createElement("span");
            tagText.textContent = text;
            tag.appendChild(tagText);

            const closeBtn = doc.createElement("span");
            closeBtn.textContent = "x";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.color = "red";
            closeBtn.style.fontWeight = "bold";
            closeBtn.style.marginLeft = "4px";
            closeBtn.onclick = () => {
                tagsDisplay.removeChild(tag);
                item.removeTag(text);
            };
            tag.appendChild(closeBtn);

            tagsDisplay.appendChild(tag);
        };

        // Initialize with item tags
        item.getTags().forEach((t: any) => addTagToUI(t.tag));

        // Input Area
        const inputArea = doc.createElement("div");
        inputArea.style.display = "flex";
        inputArea.style.gap = "8px";
        tagsContent.appendChild(inputArea);

        const input = doc.createElement("input");
        input.type = "text";
        input.placeholder = "标签输入框";
        input.style.flex = "1";
        inputArea.appendChild(input);

        const submitBtn = doc.createElement("button");
        submitBtn.textContent = "submit";
        submitBtn.onclick = () => {
            const val = input.value.trim();
            if (val) {
                addTagToUI(val);
                item.addTag(val);
                input.value = "";
            }
        };
        inputArea.appendChild(submitBtn);

        const saveBtn = doc.createElement("button");
        saveBtn.textContent = "save";
        saveBtn.onclick = () => {
            // Create Popup Overlay
            const overlay = doc.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            overlay.style.display = "flex";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "center";
            overlay.style.zIndex = "1000";
            tagsSection.style.position = "relative"; // Ensure section is relative
            tagsSection.appendChild(overlay);

            const popup = doc.createElement("div");
            popup.style.backgroundColor = "var(--material-background)";
            popup.style.color = "var(--material-on-background)";
            popup.style.padding = "16px";
            popup.style.borderRadius = "4px";
            popup.style.display = "flex";
            popup.style.flexDirection = "column";
            popup.style.gap = "8px";
            popup.style.minWidth = "200px";
            popup.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            overlay.appendChild(popup);

            const label = doc.createElement("label");
            label.textContent = "ClassName";
            popup.appendChild(label);

            const nameInput = doc.createElement("input");
            nameInput.type = "text";
            nameInput.style.color = "#ffffffff";
            nameInput.style.backgroundColor = "#615f5fff";
            nameInput.style.border = "1px solid #120c30ff";
            nameInput.style.padding = "4px";
            popup.appendChild(nameInput);

            const btnRow = doc.createElement("div");
            btnRow.style.display = "flex";
            btnRow.style.justifyContent = "flex-end";
            btnRow.style.gap = "8px";
            popup.appendChild(btnRow);

            const cancelBtn = doc.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.onclick = () => tagsSection.removeChild(overlay);
            btnRow.appendChild(cancelBtn);

            const confirmBtn = doc.createElement("button");
            confirmBtn.textContent = "Save";
            confirmBtn.onclick = () => {
                const name = nameInput.value.trim();
                if (name) {
                    // Get current tags from UI (safer than item tags as they might be pending)
                    // But actually addTagToUI calls item.addTag immediately, so item.getTags() is mostly correct.
                    // However, let's grab from the display box to be sure we match what user sees.
                    const tags = Array.from(tagsDisplay.children)
                        .map(span => span.firstChild?.textContent) // First child is text span
                        .filter(t => t)
                        .join(" | ");

                    let savedClasses: any[] = [];
                    try {
                        const savedStr = getPref("arxivClasses" as any) as string;
                        if (savedStr) savedClasses = JSON.parse(savedStr);
                    } catch (e) {
                        ztoolkit.log("Error loading arxivClasses", e);
                    }
                    savedClasses.push({ name, description: tags });
                    setPref("arxivClasses" as any, JSON.stringify(savedClasses));
                    
                    refreshClassList();
                    tagsSection.removeChild(overlay);
                }
            };
            btnRow.appendChild(confirmBtn);
        };
        inputArea.appendChild(saveBtn);

        // --- Prompt of Instruction Selecting Section ---
        const promptSection = doc.createElement("div");
        promptSection.style.padding = "16px 8px 8px 8px";
        promptSection.style.borderTop = "4px solid #444";
        promptSection.style.marginTop = "16px";
        promptSection.style.display = "flex";
        promptSection.style.flexDirection = "column";
        promptSection.style.gap = "8px";
        container.appendChild(promptSection);

        // Header for Collapse
        const promptHeader = doc.createElement("div");
        promptHeader.style.display = "flex";
        promptHeader.style.justifyContent = "space-between";
        promptHeader.style.alignItems = "center";
        promptHeader.style.cursor = "pointer";
        promptSection.appendChild(promptHeader);

        // Prompt Label
        const promptLabel = doc.createElement("label");
        promptLabel.textContent = "Prompt of Instruction Selecting";
        promptLabel.style.textAlign = "left";
        promptLabel.style.fontWeight = "bold";
        promptLabel.style.marginBottom = "4px";
        promptLabel.style.cursor = "pointer";
        promptHeader.appendChild(promptLabel);

        const promptArrow = doc.createElement("span");
        promptArrow.textContent = "▼";
        promptHeader.appendChild(promptArrow);

        // Content Container
        const promptContent = doc.createElement("div");
        promptContent.style.display = "flex";
        promptContent.style.flexDirection = "column";
        promptContent.style.gap = "8px";
        promptSection.appendChild(promptContent);

        promptHeader.onclick = () => {
            if (promptContent.style.display === "none") {
                promptContent.style.display = "flex";
                promptArrow.textContent = "▼";
            } else {
                promptContent.style.display = "none";
                promptArrow.textContent = "▶";
            }
        };

        // Prompt List Table
        // TODO: The user image does not show a table for this section, but asked to refer to logic of above component (which has a table).
        // I will add the table but keep it hidden if empty, or just add it for consistency.
        const promptTable = doc.createElement("table");
        promptTable.style.width = "100%";
        promptTable.style.borderCollapse = "collapse";
        promptTable.style.marginBottom = "8px";
        promptTable.style.fontSize = "12px";
        
        const pThead = doc.createElement("thead");
        const pHeaderRow = doc.createElement("tr");
        ["", "PromptName", "content"].forEach(text => {
            const th = doc.createElement("th");
            th.textContent = text;
            th.style.border = "1px solid #ccc";
            th.style.padding = "4px";
            th.style.textAlign = "left";
            pHeaderRow.appendChild(th);
        });
        pThead.appendChild(pHeaderRow);
        promptTable.appendChild(pThead);

        const pTbody = doc.createElement("tbody");
        promptTable.appendChild(pTbody);
        promptContent.appendChild(promptTable);

        // Load saved prompts
        const refreshPromptList = () => {
            pTbody.innerHTML = "";
            let savedPrompts: any[] = [];
            try {
                const savedStr = getPref("instructionPrompts" as any) as string;
                if (savedStr) savedPrompts = JSON.parse(savedStr);
            } catch (e) {
                ztoolkit.log("Error loading instructionPrompts", e);
            }
            
            savedPrompts.forEach(p => {
                const tr = doc.createElement("tr");

                const tdCheck = doc.createElement("td");
                tdCheck.style.border = "1px solid #ccc";
                tdCheck.style.padding = "4px";
                tdCheck.style.textAlign = "center";
                tdCheck.style.width = "30px";
                
                const checkbox = doc.createElement("input");
                checkbox.type = "checkbox";
                checkbox.onclick = () => {
                    if (checkbox.checked) {
                        const allChecks = pTbody.querySelectorAll("input[type='checkbox']");
                        allChecks.forEach((c: any) => {
                            if (c !== checkbox) c.checked = false;
                        });
                    }
                };
                tdCheck.appendChild(checkbox);
                tr.appendChild(tdCheck);
                
                const tdName = doc.createElement("td");
                tdName.textContent = p.name;
                tdName.style.border = "1px solid #ccc";
                tdName.style.padding = "4px";
                tr.appendChild(tdName);

                const tdContent = doc.createElement("td");
                tdContent.textContent = p.content;
                tdContent.style.border = "1px solid #ccc";
                tdContent.style.padding = "4px";
                tr.appendChild(tdContent);

                pTbody.appendChild(tr);
            });
        };
        refreshPromptList();

        // Prompt Display Box (similar to tagsDisplay but for prompts)
        const promptDisplay = doc.createElement("div");
        promptDisplay.style.border = "1px solid #ddd";
        promptDisplay.style.borderRadius = "4px";
        promptDisplay.style.minHeight = "80px"; // Taller as per screenshot
        promptDisplay.style.padding = "4px";
        promptDisplay.style.display = "flex";
        promptDisplay.style.flexDirection = "column"; // Prompts are likely lines of text
        promptDisplay.style.gap = "4px";
        promptContent.appendChild(promptDisplay);

        const addPromptToUI = (text: string) => {
            const pItem = doc.createElement("div");
            pItem.style.padding = "4px";
            pItem.style.borderBottom = "1px solid #eee";
            pItem.style.display = "flex";
            pItem.style.justifyContent = "space-between";
            pItem.style.alignItems = "center";
            
            const pText = doc.createElement("span");
            pText.textContent = text;
            pItem.appendChild(pText);

            const closeBtn = doc.createElement("span");
            closeBtn.textContent = "x";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.color = "red";
            closeBtn.style.fontWeight = "bold";
            closeBtn.style.marginLeft = "8px";
            closeBtn.onclick = () => {
                promptDisplay.removeChild(pItem);
            };
            pItem.appendChild(closeBtn);

            promptDisplay.appendChild(pItem);
        };

        // Prompt Input Area
        const pInputArea = doc.createElement("div");
        pInputArea.style.display = "flex";
        pInputArea.style.gap = "8px";
        promptContent.appendChild(pInputArea);

        const pInput = doc.createElement("input");
        pInput.type = "text";
        pInput.placeholder = "提示词输入框...";
        pInput.style.flex = "1";
        pInputArea.appendChild(pInput);

        const pSubmitBtn = doc.createElement("button");
        pSubmitBtn.textContent = "submit";
        pSubmitBtn.onclick = () => {
            const val = pInput.value.trim();
            if (val) {
                addPromptToUI(val);
                pInput.value = "";
            }
        };
        pInputArea.appendChild(pSubmitBtn);

        const pSaveBtn = doc.createElement("button");
        pSaveBtn.textContent = "save";
        pSaveBtn.onclick = () => {
            // Reusing popup logic but for prompts
            const overlay = doc.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            overlay.style.display = "flex";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "center";
            overlay.style.zIndex = "1000";
            promptSection.style.position = "relative";
            promptSection.appendChild(overlay);

            const popup = doc.createElement("div");
            popup.style.backgroundColor = "var(--material-background)";
            popup.style.color = "var(--material-on-background)";
            popup.style.padding = "16px";
            popup.style.borderRadius = "4px";
            popup.style.display = "flex";
            popup.style.flexDirection = "column";
            popup.style.gap = "8px";
            popup.style.minWidth = "200px";
            popup.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            overlay.appendChild(popup);

            const label = doc.createElement("label");
            label.textContent = "PromptName"; // Changed from ClassName
            popup.appendChild(label);

            const nameInput = doc.createElement("input");
            nameInput.type = "text";
            nameInput.style.color = "#ffffffff";
            nameInput.style.backgroundColor = "#615f5fff";
            nameInput.style.border = "1px solid #120c30ff";
            nameInput.style.padding = "4px";
            popup.appendChild(nameInput);

            const btnRow = doc.createElement("div");
            btnRow.style.display = "flex";
            btnRow.style.justifyContent = "flex-end";
            btnRow.style.gap = "8px";
            popup.appendChild(btnRow);

            const cancelBtn = doc.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.onclick = () => promptSection.removeChild(overlay);
            btnRow.appendChild(cancelBtn);

            const confirmBtn = doc.createElement("button");
            confirmBtn.textContent = "Save";
            confirmBtn.onclick = () => {
                const name = nameInput.value.trim();
                if (name) {
                    const content = Array.from(promptDisplay.children)
                        .map(div => div.firstChild?.textContent)
                        .filter(t => t)
                        .join(" | ");

                    let savedPrompts: any[] = [];
                    try {
                        const savedStr = getPref("instructionPrompts" as any) as string;
                        if (savedStr) savedPrompts = JSON.parse(savedStr);
                    } catch (e) {
                        ztoolkit.log("Error loading instructionPrompts", e);
                    }

                    savedPrompts.push({ name, content });
                    setPref("instructionPrompts" as any, JSON.stringify(savedPrompts));
                    
                    refreshPromptList();
                    promptSection.removeChild(overlay);
                }
            };
            btnRow.appendChild(confirmBtn);
        };
        pInputArea.appendChild(pSaveBtn);

        // --- Prompt of Summary Section ---
        const summarySection = doc.createElement("div");
        summarySection.style.padding = "16px 8px 8px 8px";
        summarySection.style.borderTop = "4px solid #444";
        summarySection.style.marginTop = "16px";
        summarySection.style.display = "flex";
        summarySection.style.flexDirection = "column";
        summarySection.style.gap = "8px";
        container.appendChild(summarySection);

        // Header for Collapse
        const summaryHeader = doc.createElement("div");
        summaryHeader.style.display = "flex";
        summaryHeader.style.justifyContent = "space-between";
        summaryHeader.style.alignItems = "center";
        summaryHeader.style.cursor = "pointer";
        summarySection.appendChild(summaryHeader);

        // Summary Label
        const summaryLabel = doc.createElement("label");
        summaryLabel.textContent = "Prompt of Summary";
        summaryLabel.style.textAlign = "left";
        summaryLabel.style.fontWeight = "bold";
        summaryLabel.style.marginBottom = "4px";
        summaryLabel.style.cursor = "pointer";
        summaryHeader.appendChild(summaryLabel);

        const summaryArrow = doc.createElement("span");
        summaryArrow.textContent = "▼";
        summaryHeader.appendChild(summaryArrow);

        // Content Container
        const summaryContent = doc.createElement("div");
        summaryContent.style.display = "flex";
        summaryContent.style.flexDirection = "column";
        summaryContent.style.gap = "8px";
        summarySection.appendChild(summaryContent);

        summaryHeader.onclick = () => {
            if (summaryContent.style.display === "none") {
                summaryContent.style.display = "flex";
                summaryArrow.textContent = "▼";
            } else {
                summaryContent.style.display = "none";
                summaryArrow.textContent = "▶";
            }
        };

        // Summary List Table
        const summaryTable = doc.createElement("table");
        summaryTable.style.width = "100%";
        summaryTable.style.borderCollapse = "collapse";
        summaryTable.style.marginBottom = "8px";
        summaryTable.style.fontSize = "12px";
        
        const sThead = doc.createElement("thead");
        const sHeaderRow = doc.createElement("tr");
        ["", "PromptName", "content"].forEach(text => {
            const th = doc.createElement("th");
            th.textContent = text;
            th.style.border = "1px solid #ccc";
            th.style.padding = "4px";
            th.style.textAlign = "left";
            sHeaderRow.appendChild(th);
        });
        sThead.appendChild(sHeaderRow);
        summaryTable.appendChild(sThead);

        const sTbody = doc.createElement("tbody");
        summaryTable.appendChild(sTbody);
        summaryContent.appendChild(summaryTable);

        // Load saved summaries
        const refreshSummaryList = () => {
            sTbody.innerHTML = "";
            let savedSummaries: any[] = [];
            try {
                const savedStr = getPref("summaryPrompts" as any) as string;
                if (savedStr) savedSummaries = JSON.parse(savedStr);
            } catch (e) {
                ztoolkit.log("Error loading summaryPrompts", e);
            }
            
            savedSummaries.forEach(p => {
                const tr = doc.createElement("tr");

                const tdCheck = doc.createElement("td");
                tdCheck.style.border = "1px solid #ccc";
                tdCheck.style.padding = "4px";
                tdCheck.style.textAlign = "center";
                tdCheck.style.width = "30px";
                
                const checkbox = doc.createElement("input");
                checkbox.type = "checkbox";
                checkbox.onclick = () => {
                    if (checkbox.checked) {
                        const allChecks = sTbody.querySelectorAll("input[type='checkbox']");
                        allChecks.forEach((c: any) => {
                            if (c !== checkbox) c.checked = false;
                        });
                    }
                };
                tdCheck.appendChild(checkbox);
                tr.appendChild(tdCheck);
                
                const tdName = doc.createElement("td");
                tdName.textContent = p.name;
                tdName.style.border = "1px solid #ccc";
                tdName.style.padding = "4px";
                tr.appendChild(tdName);

                const tdContent = doc.createElement("td");
                tdContent.textContent = p.content;
                tdContent.style.border = "1px solid #ccc";
                tdContent.style.padding = "4px";
                tr.appendChild(tdContent);

                sTbody.appendChild(tr);
            });
        };
        refreshSummaryList();

        // Summary Display Box
        const summaryDisplay = doc.createElement("div");
        summaryDisplay.style.border = "1px solid #ddd";
        summaryDisplay.style.borderRadius = "4px";
        summaryDisplay.style.minHeight = "80px";
        summaryDisplay.style.padding = "4px";
        summaryDisplay.style.display = "flex";
        summaryDisplay.style.flexDirection = "column";
        summaryDisplay.style.gap = "4px";
        summaryContent.appendChild(summaryDisplay);

        const addSummaryToUI = (text: string) => {
            const sItem = doc.createElement("div");
            sItem.style.padding = "4px";
            sItem.style.borderBottom = "1px solid #eee";
            sItem.style.display = "flex";
            sItem.style.justifyContent = "space-between";
            sItem.style.alignItems = "center";
            
            const sText = doc.createElement("span");
            sText.textContent = text;
            sItem.appendChild(sText);

            const closeBtn = doc.createElement("span");
            closeBtn.textContent = "x";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.color = "red";
            closeBtn.style.fontWeight = "bold";
            closeBtn.style.marginLeft = "8px";
            closeBtn.onclick = () => {
                summaryDisplay.removeChild(sItem);
            };
            sItem.appendChild(closeBtn);

            summaryDisplay.appendChild(sItem);
        };

        // Summary Input Area
        const sInputArea = doc.createElement("div");
        sInputArea.style.display = "flex";
        sInputArea.style.gap = "8px";
        summaryContent.appendChild(sInputArea);

        const sInput = doc.createElement("input");
        sInput.type = "text";
        sInput.placeholder = "提示词输入框...";
        sInput.style.flex = "1";
        sInputArea.appendChild(sInput);

        const sSubmitBtn = doc.createElement("button");
        sSubmitBtn.textContent = "submit";
        sSubmitBtn.onclick = () => {
            const val = sInput.value.trim();
            if (val) {
                addSummaryToUI(val);
                sInput.value = "";
            }
        };
        sInputArea.appendChild(sSubmitBtn);

        const sSaveBtn = doc.createElement("button");
        sSaveBtn.textContent = "save";
        sSaveBtn.onclick = () => {
            const overlay = doc.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            overlay.style.display = "flex";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "center";
            overlay.style.zIndex = "1000";
            summarySection.style.position = "relative";
            summarySection.appendChild(overlay);

            const popup = doc.createElement("div");
            popup.style.backgroundColor = "var(--material-background)";
            popup.style.color = "var(--material-on-background)";
            popup.style.padding = "16px";
            popup.style.borderRadius = "4px";
            popup.style.display = "flex";
            popup.style.flexDirection = "column";
            popup.style.gap = "8px";
            popup.style.minWidth = "200px";
            popup.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            overlay.appendChild(popup);

            const label = doc.createElement("label");
            label.textContent = "PromptName";
            popup.appendChild(label);

            const nameInput = doc.createElement("input");
            nameInput.type = "text";
            nameInput.style.color = "#ffffffff";
            nameInput.style.backgroundColor = "#615f5fff";
            nameInput.style.border = "1px solid #120c30ff";
            nameInput.style.padding = "4px";
            popup.appendChild(nameInput);

            const btnRow = doc.createElement("div");
            btnRow.style.display = "flex";
            btnRow.style.justifyContent = "flex-end";
            btnRow.style.gap = "8px";
            popup.appendChild(btnRow);

            const cancelBtn = doc.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.onclick = () => summarySection.removeChild(overlay);
            btnRow.appendChild(cancelBtn);

            const confirmBtn = doc.createElement("button");
            confirmBtn.textContent = "Save";
            confirmBtn.onclick = () => {
                const name = nameInput.value.trim();
                if (name) {
                    const content = Array.from(summaryDisplay.children)
                        .map(div => div.firstChild?.textContent)
                        .filter(t => t)
                        .join(" | ");

                    let savedSummaries: any[] = [];
                    try {
                        const savedStr = getPref("summaryPrompts" as any) as string;
                        if (savedStr) savedSummaries = JSON.parse(savedStr);
                    } catch (e) {
                        ztoolkit.log("Error loading summaryPrompts", e);
                    }

                    savedSummaries.push({ name, content });
                    setPref("summaryPrompts" as any, JSON.stringify(savedSummaries));
                    
                    refreshSummaryList();
                    summarySection.removeChild(overlay);
                }
            };
            btnRow.appendChild(confirmBtn);
        };
        sInputArea.appendChild(sSaveBtn);




        // Folder Selection
        const folderSection = doc.createElement("div");
        folderSection.style.padding = "16px 8px 16px 8px";
        folderSection.style.borderTop = "4px solid #444";
        folderSection.style.borderBottom = "4px solid #444";
        folderSection.style.marginTop = "16px";
        folderSection.style.marginBottom = "16px";
        container.appendChild(folderSection);

        const folderArea = doc.createElement("div");
        folderArea.style.display = "flex";
        folderArea.style.gap = "8px";
        folderArea.style.alignItems = "center";
        folderSection.appendChild(folderArea);

        const folderLabel = doc.createElement("label");
        folderLabel.textContent = "文件根目录";
        folderArea.appendChild(folderLabel);

        const folderInput = doc.createElement("input");
        folderInput.type = "text";
        folderInput.placeholder = "Folder path...";
        folderInput.style.flex = "1";
        folderArea.appendChild(folderInput);

        const selectBtn = doc.createElement("button");
        selectBtn.textContent = "select";
        selectBtn.onclick = async () => {
            const path = await new ztoolkit.FilePicker(
                "Select Folder",
                "folder",
                []
            ).open();
            if (path) {
                folderInput.value = path as string;
            }
        };
        folderArea.appendChild(selectBtn);

        container.appendChild(footer);

        // Window Hours Section
        const windowSection = doc.createElement("div");
        windowSection.style.padding = "16px 8px 32px 8px";
        windowSection.style.borderBottom = "4px solid #444";
        windowSection.style.marginBottom = "16px";
        windowSection.style.display = "flex";
        windowSection.style.alignItems = "center";
        windowSection.style.gap = "8px";
        container.appendChild(windowSection);

        const wLabel = doc.createElement("label");
        wLabel.textContent = "Window Hours:";
        windowSection.appendChild(wLabel);

        const wInput = doc.createElement("input");
        wInput.type = "text";
        wInput.style.flex = "1";
        wInput.value = (getPref("windowHours" as any) || "") as string;
        wInput.onchange = () => {
             setPref("windowHours" as any, wInput.value);
        };
        windowSection.appendChild(wInput);

        const startBtn = doc.createElement("button");
        startBtn.textContent = "开始识别";
        startBtn.style.width = "100%";
        startBtn.style.padding = "24px 12px";
        startBtn.style.marginTop = "16px";
        startBtn.style.fontSize = "20px";
        startBtn.style.fontWeight = "bold";
        startBtn.style.cursor = "pointer";
        startBtn.style.display = "flex";
        startBtn.style.justifyContent = "center";
        startBtn.style.alignItems = "center";
        startBtn.style.backgroundColor = "#4CAF50"; 
        startBtn.style.color = "#FFFFFF";
        startBtn.onclick = async () => {
            ztoolkit.log("Start Recognition clicked");
            
            // 1. Get Arxiv Class
            let arxivClass = {};
            const classCheckbox = tbody.querySelector("input[type='checkbox']:checked");
            if (classCheckbox) {
                const tr = classCheckbox.closest("tr");
                if (tr) {
                    arxivClass = {
                        name: tr.children[1].textContent,
                        description: tr.children[2].textContent
                    };
                }
            }

            // 2. Get Instruction Prompt
            let instructionPrompt = {};
            const promptCheckbox = pTbody.querySelector("input[type='checkbox']:checked");
            if (promptCheckbox) {
                const tr = promptCheckbox.closest("tr");
                if (tr) {
                     instructionPrompt = {
                        name: tr.children[1].textContent,
                        content: tr.children[2].textContent
                    };
                }
            }

            // 3. Get Summary Prompt
            let summaryPrompt = {};
            const summaryCheckbox = sTbody.querySelector("input[type='checkbox']:checked");
            if (summaryCheckbox) {
                const tr = summaryCheckbox.closest("tr");
                if (tr) {
                     summaryPrompt = {
                        name: tr.children[1].textContent,
                        content: tr.children[2].textContent
                    };
                }
            }
            
            // 4. Other inputs
            const folderPath = folderInput.value;
            const windowHours = wInput.value;
            const model = select.value;
            
            const payload = {
                arxiv_class: arxivClass,
                instruction_prompt: instructionPrompt,
                summary_prompt: summaryPrompt,
                folder_path: folderPath,
                window_hours: windowHours,
                model: model
            };
            
            ztoolkit.log("Sending payload:", payload);
            
            try {
                const response = await fetch("http://127.0.0.1:23333/start_recognition", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                     const data = await response.json() as any;
                     ztoolkit.log("Recognition started:", data);
                     const msg = data.task_id ? `Task ID: ${data.task_id}` : `Status: ${data.status}`;
                     logDisplay.value += `\n[${new Date().toLocaleTimeString()}] Request Sent! ${msg}`;
                } else {
                     ztoolkit.log("Server error:", response.statusText);
                     logDisplay.value += `\n[${new Date().toLocaleTimeString()}] Server Error: ${response.statusText}`;
                }
            } catch (e) {
                ztoolkit.log("Network error:", e);
                logDisplay.value += `\n[${new Date().toLocaleTimeString()}] Network Error: ${e}`;
            }
        };
        container.appendChild(startBtn);
      },
    });
  }

  @example
  static async registerReaderItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "reader-example",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example2-head-text"),
        // Optional
        l10nArgs: `{"status": "Initialized"}`,
        // Can also have a optional dark icon
        icon: "chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/save.svg",
      },
      // Optional
      bodyXHTML:
        '<html:h1 id="test">THIS IS TEST</html:h1><browser disableglobalhistory="true" remote="true" maychangeremoteness="true" type="content" flex="1" id="browser" style="width: 180%; height: 280px"/>',
      // Optional, Called when the section is first created, must be synchronous
      onInit: ({ item }) => {
        ztoolkit.log("Section init!", item?.id);
      },
      // Optional, Called when the section is destroyed, must be synchronous
      onDestroy: (props) => {
        ztoolkit.log("Section destroy!");
      },
      // Optional, Called when the section data changes (setting item/mode/tabType/inTrash), must be synchronous. return false to cancel the change
      onItemChange: ({ item, setEnabled, tabType }) => {
        ztoolkit.log(`Section item data changed to ${item?.id}`);
        setEnabled(tabType === "reader");
        return true;
      },
      // Called when the section is asked to render, must be synchronous.
      onRender: ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        ztoolkit.log("Section rendered!", item?.id);
        const title = body.querySelector("#test") as HTMLElement;
        title.style.color = "red";
        title.textContent = "LOADING";
        setL10nArgs(`{ "status": "Loading" }`);
        setSectionSummary("loading!");
        setSectionButtonStatus("test", { hidden: true });
      },
      // Optional, can be asynchronous.
      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        ztoolkit.log("Section secondary render start!", item?.id);
        await Zotero.Promise.delay(1000);
        ztoolkit.log("Section secondary render finish!", item?.id);
        const title = body.querySelector("#test") as HTMLElement;
        title.style.color = "green";
        title.textContent = item.getField("title");
        setL10nArgs(`{ "status": "Loaded" }`);
        setSectionSummary("rendered!");
        setSectionButtonStatus("test", { hidden: false });
      },
      // Optional, Called when the section is toggled. Can happen anytime even if the section is not visible or not rendered
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },
      // Optional, Buttons to be shown in the section header
      sectionButtons: [
        {
          type: "test",
          icon: "chrome://zotero/skin/16/universal/empty-trash.svg",
          l10nID: getLocaleID("item-section-example2-button-tooltip"),
          onClick: ({ item, paneID }) => {
            ztoolkit.log("Section clicked!", item?.id);
            Zotero.ItemPaneManager.unregisterSection(paneID);
          },
        },
      ],
    });
  }
}

export class PromptExampleFactory {
  @example
  static registerNormalCommandExample() {
    ztoolkit.Prompt.register([
      {
        name: "Normal Command Test",
        label: "Plugin Template",
        callback(prompt) {
          ztoolkit.getGlobal("alert")("Command triggered!");
        },
      },
    ]);
  }

  @example
  static registerAnonymousCommandExample(window: Window) {
    ztoolkit.Prompt.register([
      {
        id: "search",
        callback: async (prompt) => {
          // https://github.com/zotero/zotero/blob/7262465109c21919b56a7ab214f7c7a8e1e63909/chrome/content/zotero/integration/quickFormat.js#L589
          function getItemDescription(item: Zotero.Item) {
            const nodes = [];
            let str = "";
            let author,
              authorDate = "";
            if (item.firstCreator) {
              author = authorDate = item.firstCreator;
            }
            let date = item.getField("date", true, true) as string;
            if (date && (date = date.substr(0, 4)) !== "0000") {
              authorDate += " (" + parseInt(date) + ")";
            }
            authorDate = authorDate.trim();
            if (authorDate) nodes.push(authorDate);

            const publicationTitle = item.getField(
              "publicationTitle",
              false,
              true,
            );
            if (publicationTitle) {
              nodes.push(`<i>${publicationTitle}</i>`);
            }
            let volumeIssue = item.getField("volume");
            const issue = item.getField("issue");
            if (issue) volumeIssue += "(" + issue + ")";
            if (volumeIssue) nodes.push(volumeIssue);

            const publisherPlace = [];
            let field;
            if ((field = item.getField("publisher")))
              publisherPlace.push(field);
            if ((field = item.getField("place"))) publisherPlace.push(field);
            if (publisherPlace.length) nodes.push(publisherPlace.join(": "));

            const pages = item.getField("pages");
            if (pages) nodes.push(pages);

            if (!nodes.length) {
              const url = item.getField("url");
              if (url) nodes.push(url);
            }

            // compile everything together
            for (let i = 0, n = nodes.length; i < n; i++) {
              const node = nodes[i];

              if (i != 0) str += ", ";

              if (typeof node === "object") {
                const label =
                  Zotero.getMainWindow().document.createElement("label");
                label.setAttribute("value", str);
                label.setAttribute("crop", "end");
                str = "";
              } else {
                str += node;
              }
            }
            if (str.length) str += ".";
            return str;
          }
          function filter(ids: number[]) {
            ids = ids.filter(async (id) => {
              const item = (await Zotero.Items.getAsync(id)) as Zotero.Item;
              return item.isRegularItem() && !(item as any).isFeedItem;
            });
            return ids;
          }
          const text = prompt.inputNode.value;
          prompt.showTip("Searching...");
          const s = new Zotero.Search();
          s.addCondition("quicksearch-titleCreatorYear", "contains", text);
          s.addCondition("itemType", "isNot", "attachment");
          let ids = await s.search();
          // prompt.exit will remove current container element.
          // @ts-expect-error ignore
          prompt.exit();
          const container = prompt.createCommandsContainer();
          container.classList.add("suggestions");
          ids = filter(ids);
          console.log(ids.length);
          if (ids.length == 0) {
            const s = new Zotero.Search();
            const operators = [
              "is",
              "isNot",
              "true",
              "false",
              "isInTheLast",
              "isBefore",
              "isAfter",
              "contains",
              "doesNotContain",
              "beginsWith",
            ];
            let hasValidCondition = false;
            let joinMode = "all";
            if (/\s*\|\|\s*/.test(text)) {
              joinMode = "any";
            }
            text.split(/\s*(&&|\|\|)\s*/g).forEach((conditinString: string) => {
              const conditions = conditinString.split(/\s+/g);
              if (
                conditions.length == 3 &&
                operators.indexOf(conditions[1]) != -1
              ) {
                hasValidCondition = true;
                s.addCondition(
                  "joinMode",
                  joinMode as _ZoteroTypes.Search.Operator,
                  "",
                );
                s.addCondition(
                  conditions[0] as string,
                  conditions[1] as _ZoteroTypes.Search.Operator,
                  conditions[2] as string,
                );
              }
            });
            if (hasValidCondition) {
              ids = await s.search();
            }
          }
          ids = filter(ids);
          console.log(ids.length);
          if (ids.length > 0) {
            ids.forEach((id: number) => {
              const item = Zotero.Items.get(id);
              const title = item.getField("title");
              const ele = ztoolkit.UI.createElement(window.document!, "div", {
                namespace: "html",
                classList: ["command"],
                listeners: [
                  {
                    type: "mousemove",
                    listener: function () {
                      // @ts-expect-error ignore
                      prompt.selectItem(this);
                    },
                  },
                  {
                    type: "click",
                    listener: () => {
                      prompt.promptNode.style.display = "none";
                      ztoolkit.getGlobal("Zotero_Tabs").select("zotero-pane");
                      ztoolkit.getGlobal("ZoteroPane").selectItem(item.id);
                    },
                  },
                ],
                styles: {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "start",
                },
                children: [
                  {
                    tag: "span",
                    styles: {
                      fontWeight: "bold",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    properties: {
                      innerText: title,
                    },
                  },
                  {
                    tag: "span",
                    styles: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    properties: {
                      innerHTML: getItemDescription(item),
                    },
                  },
                ],
              });
              container.appendChild(ele);
            });
          } else {
            // @ts-expect-error ignore
            prompt.exit();
            prompt.showTip("Not Found.");
          }
        },
      },
    ]);
  }

  @example
  static registerConditionalCommandExample() {
    ztoolkit.Prompt.register([
      {
        name: "Conditional Command Test",
        label: "Plugin Template",
        // The when function is executed when Prompt UI is woken up by `Shift + P`, and this command does not display when false is returned.
        when: () => {
          const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
          return items.length > 0;
        },
        callback(prompt) {
          prompt.inputNode.placeholder = "Hello World!";
          const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
          ztoolkit.getGlobal("alert")(
            `You select ${items.length} items!\n\n${items
              .map(
                (item, index) =>
                  String(index + 1) + ". " + item.getDisplayTitle(),
              )
              .join("\n")}`,
          );
        },
      },
    ]);
  }
}

export class HelperExampleFactory {


  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
        "text/unicode",
      )
      .addText(
        '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
        "text/html",
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"],
      ],
      "image.png",
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
