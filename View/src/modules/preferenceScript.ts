import { config } from "../../package.json";

type SavedConfig = {
  apiType: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  relatedNumber: number;
};

const DEFAULT_COLUMNS = [
  {
    dataKey: "__selected",
    label: "",
    fixedWidth: true,
    width: 36,
  },
  {
    dataKey: "id",
    label: "ID",
    fixedWidth: true,
    width: 40,
  },
  {
    dataKey: "apiUrl",
    label: "URL",
    fixedWidth: true,
    width: 220,
  },
  {
    dataKey: "apiKeyMasked",
    label: "API_KEY",
    fixedWidth: true,
    width: 120,
  },
  {
    dataKey: "maxTokens",
    label: "MAX_TOKENS",
    fixedWidth: true,
    width: 140,
  },
  {
    dataKey: "temperature",
    label: "TEMPERATURE",
    fixedWidth: true,
    width: 140,
  },
  {
    dataKey: "relatedNumber",
    label: "RELATED",
    fixedWidth: true,
    width: 110,
  },
];

const DEFAULT_MINERU_COLUMNS = [
  {
    dataKey: "__selected",
    label: "",
    fixedWidth: true,
    width: 36,
  },
  {
    dataKey: "index",
    label: "Index",
    fixedWidth: true,
    width: 60,
  },
  {
    dataKey: "token",
    label: "Token",
    fixedWidth: false,
    width: 300,
  },
];

export async function registerPrefsScripts(_window: Window) {
  const savedConfigs = loadSavedConfigs();
  const mineruTokens = loadMineruTokens();

  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: DEFAULT_COLUMNS,
      mineruColumns: DEFAULT_MINERU_COLUMNS,
      savedConfigs,
      mineruTokens,
      mineruVerify: { token: "", code: 0, message: "" },
      llmVerify: { fingerprint: "", code: 0, message: "" },
      checkedRowIndices: new Set<number>(),
      mineruCheckedRowIndices: new Set<number>(),
      tableHelper: undefined,
      mineruTableHelper: undefined,
      editingIndex: -1,
    };
  } else {
    addon.data.prefs.window = _window;
    addon.data.prefs.savedConfigs = savedConfigs;
    addon.data.prefs.mineruTokens = mineruTokens;
    addon.data.prefs.mineruVerify = { token: "", code: 0, message: "" };
    addon.data.prefs.llmVerify = { fingerprint: "", code: 0, message: "" };
    addon.data.prefs.checkedRowIndices = new Set<number>();
    addon.data.prefs.mineruCheckedRowIndices = new Set<number>();
    addon.data.prefs.editingIndex = -1;
    addon.data.prefs.columns = DEFAULT_COLUMNS;
    addon.data.prefs.mineruColumns = DEFAULT_MINERU_COLUMNS;
  }

  try {
    await updateMainTable();
    await updateMineruTable();
  } catch (e) {
    Zotero.logError(new Error(`[ArxivPaper] Error updating prefs UI: ${e}`));
  }

  try {
    bindPrefEvents();
  } catch (e) {
    Zotero.logError(new Error(`[ArxivPaper] Error binding prefs events: ${e}`));
  }
}

function $(selector: string) {
  return addon.data.prefs?.window?.document.getElementById(
    selector,
  ) as HTMLElement | null;
}

function $q(selector: string) {
  return addon.data.prefs?.window?.document.querySelector(
    selector,
  ) as HTMLElement | null;
}

// ---------------------------
// Main Table Logic (LLM)
// ---------------------------
async function updateMainTable() {
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;

  adjustTableHeight();

  const checkedRowIndices =
    addon.data.prefs.checkedRowIndices || new Set<number>();
  addon.data.prefs.checkedRowIndices = checkedRowIndices;

  const getRowData = (index: number) => {
    const c = addon.data.prefs?.savedConfigs[index];
    if (!c) {
      return {
        __selected: "",
        id: "",
        apiUrl: "",
        apiKeyMasked: "",
        model: "",
        maxTokens: "",
        temperature: "",
        relatedNumber: "",
      };
    }
    return {
      __selected: "",
      id: String(index + 1),
      apiUrl: c.apiUrl,
      apiKeyMasked: maskApiKey(c.apiKey),
      model: c.model,
      maxTokens: String(c.maxTokens),
      temperature: String(c.temperature),
      relatedNumber: String(c.relatedNumber),
    };
  };

  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.savedConfigs.length || 0)
    .setProp("getRowData", getRowData as any)
    .setProp("getRowString", (index) => {
      const c = addon.data.prefs?.savedConfigs[index];
      if (!c) return "";
      return [c.apiUrl, c.model].filter(Boolean).join(" ");
    });

  // Custom Renderer for Checkbox and Selection Highlight
  const baseRenderer: any = (
    tableHelper as any
  )?.VirtualizedTable?.makeRowRenderer(getRowData);
  if (typeof baseRenderer === "function") {
    tableHelper.setProp(
      "renderItem",
      (index, selection, oldElem, columns): Node => {
        const node: any = baseRenderer(index, selection, oldElem, columns);
        const rowElem = node as HTMLElement;
        const doc = addon.data.prefs!.window.document;

        const isSelected = (selection as any).isSelected(index);

        // Highlight Logic
        if (isSelected) {
          rowElem.style.setProperty(
            "background-color",
            "transparent",
            "important",
          );
          let bgLayer = rowElem.querySelector(
            ".custom-selection-bg",
          ) as HTMLElement;
          if (!bgLayer) {
            bgLayer = doc.createElement("div");
            bgLayer.className = "custom-selection-bg";
            bgLayer.style.position = "absolute";
            bgLayer.style.top = "0";
            bgLayer.style.bottom = "0";
            bgLayer.style.left = "0";
            bgLayer.style.width = "100%";
            bgLayer.style.backgroundColor =
              "var(--material-selection-background-color, Highlight)";
            bgLayer.style.zIndex = "0";
            bgLayer.style.pointerEvents = "none";
            rowElem.insertBefore(bgLayer, rowElem.firstChild);
          }
        } else {
          const bgLayer = rowElem.querySelector(".custom-selection-bg");
          if (bgLayer) bgLayer.remove();
          rowElem.style.removeProperty("background-color");
        }

        // Checkbox Logic
        const existingSticky = rowElem.querySelector(".custom-sticky-wrapper");
        if (existingSticky) existingSticky.remove();
        const cells = rowElem.querySelectorAll(".cell");
        if (cells[0]) (cells[0] as HTMLElement).style.display = "none";

        const stickyWrapper = doc.createElement("div");
        stickyWrapper.className = "custom-sticky-wrapper";
        stickyWrapper.style.position = "sticky";
        stickyWrapper.style.left = "0";
        stickyWrapper.style.zIndex = "100";
        stickyWrapper.style.display = "flex";
        stickyWrapper.style.height = "100%";
        stickyWrapper.style.alignItems = "center";
        stickyWrapper.style.backgroundColor = isSelected
          ? "var(--material-selection-background-color, Highlight)"
          : "var(--zotero-item-tree-background-color, var(--material-background-color, Canvas))";
        stickyWrapper.style.color = isSelected
          ? "var(--material-selection-color, HighlightText)"
          : "var(--zotero-item-tree-color, WindowText)";

        const checkboxCell = doc.createElement("div");
        checkboxCell.style.width = "36px";
        checkboxCell.style.minWidth = "36px";
        checkboxCell.style.height = "100%";
        checkboxCell.style.display = "flex";
        checkboxCell.style.alignItems = "center";
        checkboxCell.style.justifyContent = "center";

        const checkbox = doc.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "input",
        ) as HTMLInputElement;
        checkbox.type = "checkbox";
        checkbox.checked = checkedRowIndices.has(index);
        checkbox.classList.add("custom-checkbox");
        checkbox.style.zIndex = "101";

        const onCheck = (e: Event) => {
          e.stopPropagation();
          (e as any).stopImmediatePropagation?.();
          e.preventDefault();

          checkbox.checked = !checkedRowIndices.has(index);
          if (checkbox.checked) checkedRowIndices.add(index);
          else checkedRowIndices.delete(index);
          addon.data.prefs?.tableHelper?.treeInstance?.invalidate?.();
        };

        checkbox.addEventListener("mousedown", onCheck, true);
        checkbox.addEventListener(
          "pointerdown",
          (e) => {
            e.stopPropagation();
            (e as any).stopImmediatePropagation?.();
          },
          true,
        );
        checkbox.addEventListener(
          "click",
          (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true,
        );

        checkboxCell.appendChild(checkbox);
        stickyWrapper.appendChild(checkboxCell);
        rowElem.insertBefore(stickyWrapper, rowElem.firstChild);

        return node;
      },
    );
  }

  tableHelper.render(-1, () => {
    renderLock.resolve();
  });
  await renderLock.promise;
  addon.data.prefs.tableHelper = tableHelper;

  enableVTableHorizontalScrollSync(
    addon.data.prefs.window,
    `${config.addonRef}-table-container`,
  );
}

// ---------------------------
// Mineru Table Logic
// ---------------------------
async function updateMineruTable() {
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  const checkedRowIndices =
    addon.data.prefs.mineruCheckedRowIndices || new Set<number>();
  addon.data.prefs.mineruCheckedRowIndices = checkedRowIndices;

  const getRowData = (index: number) => {
    const tokens = addon.data.prefs?.mineruTokens || [];
    const token = tokens[index] || "";
    return {
      __selected: "",
      index: String(index + 1),
      token: token,
    };
  };

  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-mineru-table-container`)
    .setProp({
      id: `${config.addonRef}-mineru-prefs-table`,
      columns: addon.data.prefs?.mineruColumns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.mineruTokens?.length || 0)
    .setProp("getRowData", getRowData as any)
    .setProp(
      "getRowString",
      (index) => (addon.data.prefs?.mineruTokens || [])[index] || "",
    );

  // Custom Renderer for Checkbox
  const baseRenderer: any = (
    tableHelper as any
  )?.VirtualizedTable?.makeRowRenderer(getRowData);
  if (typeof baseRenderer === "function") {
    tableHelper.setProp(
      "renderItem",
      (index, selection, oldElem, columns): Node => {
        const node: any = baseRenderer(index, selection, oldElem, columns);
        const rowElem = node as HTMLElement;
        const doc = addon.data.prefs!.window.document;

        const isSelected = (selection as any).isSelected(index);

        // Checkbox Logic
        const existingSticky = rowElem.querySelector(".custom-sticky-wrapper");
        if (existingSticky) existingSticky.remove();
        const cells = rowElem.querySelectorAll(".cell");
        if (cells[0]) (cells[0] as HTMLElement).style.display = "none";

        const stickyWrapper = doc.createElement("div");
        stickyWrapper.className = "custom-sticky-wrapper";
        stickyWrapper.style.position = "sticky";
        stickyWrapper.style.left = "0";
        stickyWrapper.style.zIndex = "100";
        stickyWrapper.style.display = "flex";
        stickyWrapper.style.height = "100%";
        stickyWrapper.style.alignItems = "center";
        stickyWrapper.style.backgroundColor = isSelected
          ? "var(--material-selection-background-color, Highlight)"
          : "var(--zotero-item-tree-background-color, var(--material-background-color, Canvas))";
        stickyWrapper.style.color = isSelected
          ? "var(--material-selection-color, HighlightText)"
          : "var(--zotero-item-tree-color, WindowText)";

        const checkboxCell = doc.createElement("div");
        checkboxCell.style.width = "36px";
        checkboxCell.style.minWidth = "36px";
        checkboxCell.style.height = "100%";
        checkboxCell.style.display = "flex";
        checkboxCell.style.alignItems = "center";
        checkboxCell.style.justifyContent = "center";

        const checkbox = doc.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "input",
        ) as HTMLInputElement;
        checkbox.type = "checkbox";
        checkbox.checked = checkedRowIndices.has(index);
        checkbox.classList.add("custom-checkbox");
        checkbox.style.zIndex = "101";

        const onCheck = (e: Event) => {
          e.stopPropagation();
          (e as any).stopImmediatePropagation?.();
          e.preventDefault();

          checkbox.checked = !checkedRowIndices.has(index);
          if (checkbox.checked) checkedRowIndices.add(index);
          else checkedRowIndices.delete(index);
          addon.data.prefs?.mineruTableHelper?.treeInstance?.invalidate?.();
        };

        checkbox.addEventListener("mousedown", onCheck, true);
        checkbox.addEventListener(
          "pointerdown",
          (e) => {
            e.stopPropagation();
            (e as any).stopImmediatePropagation?.();
          },
          true,
        );
        checkbox.addEventListener(
          "click",
          (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
          },
          true,
        );

        checkboxCell.appendChild(checkbox);
        stickyWrapper.appendChild(checkboxCell);
        rowElem.insertBefore(stickyWrapper, rowElem.firstChild);

        return node;
      },
    );
  }

  tableHelper.render(-1, () => {
    renderLock.resolve();
  });
  await renderLock.promise;
  addon.data.prefs.mineruTableHelper = tableHelper;
  enableVTableHorizontalScrollSync(
    addon.data.prefs.window,
    `${config.addonRef}-mineru-table-container`,
  );
}

// ---------------------------
// Event Binding
// ---------------------------
function bindPrefEvents() {
  const win = addon.data.prefs!.window;

  // --- LLM Events ---
  const getLlmFingerprint = () => {
    const apiType = (
      (
        $(
          `zotero-prefpane-${config.addonRef}-api-type`,
        ) as HTMLSelectElement | null
      )?.value || ""
    ).trim();
    const apiUrl = (
      (
        $(
          `zotero-prefpane-${config.addonRef}-api-url`,
        ) as HTMLInputElement | null
      )?.value || ""
    ).trim();
    const apiKey = (
      (
        $(
          `zotero-prefpane-${config.addonRef}-api-key`,
        ) as HTMLInputElement | null
      )?.value || ""
    ).trim();
    const maxTokens = Number(
      (
        (
          $(
            `zotero-prefpane-${config.addonRef}-max-tokens`,
          ) as HTMLInputElement | null
        )?.value || ""
      ).trim(),
    );
    const relatedNumber = Number(
      (
        (
          $(
            `zotero-prefpane-${config.addonRef}-related-number`,
          ) as HTMLInputElement | null
        )?.value || ""
      ).trim(),
    );
    const temperature = Number(
      (
        (
          $(
            `zotero-prefpane-${config.addonRef}-temperature`,
          ) as HTMLInputElement | null
        )?.value || ""
      ).trim(),
    );
    const model = (
      ($(`zotero-prefpane-${config.addonRef}-model`) as HTMLInputElement | null)
        ?.value || ""
    ).trim();
    return JSON.stringify({
      apiType,
      apiUrl,
      apiKey,
      model,
      temperature,
      maxTokens,
      relatedNumber,
    });
  };
  const getLlmVerify = () =>
    addon.data.prefs!.llmVerify || { fingerprint: "", code: 0, message: "" };
  const setLlmVerify = (fingerprint: string, code: number, message: string) => {
    addon.data.prefs!.llmVerify = { fingerprint, code, message };
  };
  const updateLlmSaveEnabled = () => {
    const saveBtn = $(
      `zotero-prefpane-${config.addonRef}-save`,
    ) as HTMLButtonElement | null;
    if (!saveBtn) return;
    const fp = getLlmFingerprint();
    const v = getLlmVerify();
    saveBtn.disabled = !(v.code === 200 && v.fingerprint === fp);
  };
  const resetLlmVerify = () => {
    setLlmVerify("", 0, "");
    const status = $(
      `zotero-prefpane-${config.addonRef}-llm-test-status`,
    ) as HTMLInputElement | null;
    if (status) status.value = "";
    updateLlmSaveEnabled();
  };
  updateLlmSaveEnabled();

  (
    [
      `zotero-prefpane-${config.addonRef}-api-type`,
      `zotero-prefpane-${config.addonRef}-api-url`,
      `zotero-prefpane-${config.addonRef}-api-key`,
      `zotero-prefpane-${config.addonRef}-max-tokens`,
      `zotero-prefpane-${config.addonRef}-related-number`,
      `zotero-prefpane-${config.addonRef}-temperature`,
      `zotero-prefpane-${config.addonRef}-model`,
    ] as const
  ).forEach((id) => {
    const el = $(id) as HTMLElement | null;
    el?.addEventListener("input", resetLlmVerify);
    el?.addEventListener("change", resetLlmVerify);
  });

  $(`zotero-prefpane-${config.addonRef}-llm-test`)?.addEventListener(
    "click",
    async () => {
      const status = $(
        `zotero-prefpane-${config.addonRef}-llm-test-status`,
      ) as HTMLInputElement | null;
      if (!status) return;

      const apiType = (
        (
          $(
            `zotero-prefpane-${config.addonRef}-api-type`,
          ) as HTMLSelectElement | null
        )?.value || ""
      ).trim();
      const apiUrl = (
        (
          $(
            `zotero-prefpane-${config.addonRef}-api-url`,
          ) as HTMLInputElement | null
        )?.value || ""
      ).trim();
      const apiKey = (
        (
          $(
            `zotero-prefpane-${config.addonRef}-api-key`,
          ) as HTMLInputElement | null
        )?.value || ""
      ).trim();
      const maxTokens = Number(
        (
          (
            $(
              `zotero-prefpane-${config.addonRef}-max-tokens`,
            ) as HTMLInputElement | null
          )?.value || ""
        ).trim(),
      );
      const relatedNumber = Number(
        (
          (
            $(
              `zotero-prefpane-${config.addonRef}-related-number`,
            ) as HTMLInputElement | null
          )?.value || ""
        ).trim(),
      );
      const temperature = Number(
        (
          (
            $(
              `zotero-prefpane-${config.addonRef}-temperature`,
            ) as HTMLInputElement | null
          )?.value || ""
        ).trim(),
      );
      const model = (
        (
          $(
            `zotero-prefpane-${config.addonRef}-model`,
          ) as HTMLInputElement | null
        )?.value || ""
      ).trim();

      const fp = JSON.stringify({
        apiType,
        apiUrl,
        apiKey,
        model,
        temperature,
        maxTokens,
        relatedNumber,
      });
      setLlmVerify(fp, 0, "");
      status.value = "Testing...";
      updateLlmSaveEnabled();

      try {
        const response = await fetch("http://127.0.0.1:23333/llm_verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiType,
            apiUrl,
            apiKey,
            model,
            temperature,
            maxTokens,
            relatedNumber,
          }),
        });
        const data = (await response.json()) as any;
        const code = typeof data?.code === "number" ? data.code : -1;
        const message =
          typeof data?.message === "string" ? data.message : "Unknown response";
        setLlmVerify(fp, code, message);
        status.value = `${code}: ${message}`;
        updateLlmSaveEnabled();
      } catch (e) {
        setLlmVerify(fp, -1, String(e));
        status.value = `Network Error: ${e}`;
        updateLlmSaveEnabled();
      }
    },
  );

  // Delete
  $(`zotero-prefpane-${config.addonRef}-delete`)?.addEventListener(
    "click",
    () => {
      const tableHelper = addon.data.prefs?.tableHelper;
      const checked = addon.data.prefs?.checkedRowIndices || new Set<number>();
      const selection = tableHelper?.treeInstance?.selection;
      const selectedIndices = Array.from(
        (selection?.selected as Set<number>) || [],
      );

      // Merge checked and selected
      const toDelete = new Set([...Array.from(checked), ...selectedIndices]);
      if (toDelete.size === 0) return;

      const next = (addon.data.prefs?.savedConfigs || []).filter(
        (_, i) => !toDelete.has(i),
      );
      addon.data.prefs!.savedConfigs = next;
      addon.data.prefs!.checkedRowIndices?.clear();
      saveConfigs(next);
      adjustTableHeight();
      tableHelper?.render();
      addon.data.prefs!.editingIndex = -1;
    },
  );

  // Update (Edit: Load selected row to form)
  $(`zotero-prefpane-${config.addonRef}-update`)?.addEventListener(
    "click",
    () => {
      const tableHelper = addon.data.prefs?.tableHelper;
      const selection = tableHelper?.treeInstance?.selection;
      const selectedIndices = Array.from(
        (selection?.selected as Set<number>) || [],
      );

      if (selectedIndices.length !== 1) {
        Zotero.alert(
          win,
          "Edit Error",
          "Please select exactly one row to edit.",
        );
        return;
      }

      const index = selectedIndices[0];
      const c = addon.data.prefs!.savedConfigs[index];
      if (c) {
        fillForm(c);
        addon.data.prefs!.editingIndex = index;
        resetLlmVerify();
      }
    },
  );

  // Save (Add new row)
  $(`zotero-prefpane-${config.addonRef}-save`)?.addEventListener(
    "click",
    () => {
      updateLlmSaveEnabled();
      const v = getLlmVerify();
      const fp = getLlmFingerprint();
      if (!(v.code === 200 && v.fingerprint === fp)) {
        const status = $(
          `zotero-prefpane-${config.addonRef}-llm-test-status`,
        ) as HTMLInputElement | null;
        if (status)
          status.value = v.message
            ? `${v.code}: ${v.message}`
            : "请先 Test 通过(200)后再 Save";
        return;
      }

      const newData = getFormData();
      const current = addon.data.prefs!.savedConfigs || [];
      const next = [...current, newData];
      addon.data.prefs!.savedConfigs = next;
      saveConfigs(next);
      adjustTableHeight();
      addon.data.prefs?.tableHelper?.render();
      setLlmVerify("", 0, "");
      const status = $(
        `zotero-prefpane-${config.addonRef}-llm-test-status`,
      ) as HTMLInputElement | null;
      if (status) status.value = "200: Saved";
      updateLlmSaveEnabled();
    },
  );

  // Temperature Slider
  const tempSlider = $(
    `zotero-prefpane-${config.addonRef}-temperature`,
  ) as HTMLInputElement;
  const tempOutput = $(`zotero-prefpane-${config.addonRef}-temperature-output`);
  if (tempSlider && tempOutput) {
    tempSlider.addEventListener("input", () => {
      tempOutput.textContent = tempSlider.value;
    });
  }

  // --- Mineru Events ---
  const getMineruVerify = () =>
    ((addon.data.prefs as any)?.mineruVerify || {
      token: "",
      code: 0,
      message: "",
    }) as { token: string; code: number; message: string };
  const setMineruVerify = (token: string, code: number, message: string) => {
    (addon.data.prefs as any).mineruVerify = { token, code, message };
  };
  const updateMineruSubmitEnabled = () => {
    const input = $(
      `zotero-prefpane-${config.addonRef}-mineru-token`,
    ) as HTMLInputElement | null;
    const submitBtn = $(
      `zotero-prefpane-${config.addonRef}-mineru-submit`,
    ) as HTMLButtonElement | null;
    if (!input || !submitBtn) return;
    const currentToken = (input.value || "").trim();
    const v = getMineruVerify();
    submitBtn.disabled = !(
      currentToken &&
      v.code === 200 &&
      v.token === currentToken
    );
  };
  updateMineruSubmitEnabled();

  (
    $(
      `zotero-prefpane-${config.addonRef}-mineru-token`,
    ) as HTMLInputElement | null
  )?.addEventListener("input", () => {
    const input = $(
      `zotero-prefpane-${config.addonRef}-mineru-token`,
    ) as HTMLInputElement | null;
    const status = $(
      `zotero-prefpane-${config.addonRef}-mineru-test-status`,
    ) as HTMLInputElement | null;
    if (!input) return;
    setMineruVerify("", 0, "");
    if (status) status.value = "";
    updateMineruSubmitEnabled();
  });

  $(`zotero-prefpane-${config.addonRef}-mineru-test`)?.addEventListener(
    "click",
    async () => {
      const status = $(
        `zotero-prefpane-${config.addonRef}-mineru-test-status`,
      ) as HTMLInputElement | null;
      const input = $(
        `zotero-prefpane-${config.addonRef}-mineru-token`,
      ) as HTMLInputElement | null;
      if (!status || !input) return;

      const token = (input.value || "").trim();
      setMineruVerify(token, 0, "");
      status.value = "Testing...";
      updateMineruSubmitEnabled();

      try {
        const response = await fetch("http://127.0.0.1:23333/mineru_verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = (await response.json()) as any;
        const code = typeof data?.code === "number" ? data.code : -1;
        const message =
          typeof data?.message === "string" ? data.message : "Unknown response";
        setMineruVerify(token, code, message);
        status.value = `${code}: ${message}`;
        updateMineruSubmitEnabled();
      } catch (e) {
        setMineruVerify(token, -1, String(e));
        status.value = `Network Error: ${e}`;
        updateMineruSubmitEnabled();
      }
    },
  );

  // Submit
  $(`zotero-prefpane-${config.addonRef}-mineru-submit`)?.addEventListener(
    "click",
    () => {
      updateMineruSubmitEnabled();
      const inputForGate = $(
        `zotero-prefpane-${config.addonRef}-mineru-token`,
      ) as HTMLInputElement | null;
      const statusForGate = $(
        `zotero-prefpane-${config.addonRef}-mineru-test-status`,
      ) as HTMLInputElement | null;
      const v = getMineruVerify();
      const currentToken = (inputForGate?.value || "").trim();
      if (!(currentToken && v.code === 200 && v.token === currentToken)) {
        if (statusForGate)
          statusForGate.value = v.message
            ? `${v.code}: ${v.message}`
            : "请先 Test 通过(200)后再 Submit";
        return;
      }

      const input = $(
        `zotero-prefpane-${config.addonRef}-mineru-token`,
      ) as HTMLInputElement;
      const token = input?.value?.trim();
      if (!token) return;

      const current = addon.data.prefs!.mineruTokens || [];
      if (current.includes(token)) return;

      const next = [...current, token];
      addon.data.prefs!.mineruTokens = next;
      saveMineruTokens(next);
      input.value = "";
      setMineruVerify("", 0, "");
      const status = $(
        `zotero-prefpane-${config.addonRef}-mineru-test-status`,
      ) as HTMLInputElement | null;
      if (status) status.value = "200: Saved";
      updateMineruSubmitEnabled();
      addon.data.prefs?.mineruTableHelper?.render();
    },
  );

  // Delete
  $(`zotero-prefpane-${config.addonRef}-mineru-delete`)?.addEventListener(
    "click",
    () => {
      const tableHelper = addon.data.prefs?.mineruTableHelper;
      const checked =
        addon.data.prefs?.mineruCheckedRowIndices || new Set<number>();
      const selection = tableHelper?.treeInstance?.selection;
      const selectedIndices = Array.from(
        (selection?.selected as Set<number>) || [],
      );

      const toDelete = new Set([...Array.from(checked), ...selectedIndices]);
      if (toDelete.size === 0) return;

      const next = (addon.data.prefs!.mineruTokens || []).filter(
        (_, i) => !toDelete.has(i),
      );
      addon.data.prefs!.mineruTokens = next;
      addon.data.prefs!.mineruCheckedRowIndices?.clear();
      saveMineruTokens(next);
      tableHelper?.render();
    },
  );

  // Links
  const openLink = (id: string, url: string) => {
    $(`zotero-prefpane-${config.addonRef}-${id}`)?.addEventListener(
      "click",
      () => {
        addon.data.prefs?.window.Zotero.launchURL(url);
      },
    );
  };
  openLink("mineru-link", "https://mineru.net/");
  openLink("mineru-help", "https://mineru.net/docs");
}

function getFormData(): SavedConfig {
  const getVal = (id: string) =>
    ($(`zotero-prefpane-${config.addonRef}-${id}`) as HTMLInputElement)
      ?.value || "";

  return {
    apiType: getVal("api-type") || "full_url",
    apiUrl: getVal("api-url"),
    apiKey: getVal("api-key"),
    model: getVal("model"),
    temperature: Number(getVal("temperature")) || 1.0,
    maxTokens: Number(getVal("max-tokens")) || 32768,
    relatedNumber: Number(getVal("related-number")) || 5,
  };
}

function fillForm(c: SavedConfig) {
  const setVal = (id: string, val: string) => {
    const el = $(
      `zotero-prefpane-${config.addonRef}-${id}`,
    ) as HTMLInputElement;
    if (el) el.value = val;
  };

  setVal("api-type", c.apiType);
  setVal("api-url", c.apiUrl);
  setVal("api-key", c.apiKey);
  setVal("model", c.model);
  setVal("temperature", String(c.temperature));
  setVal("max-tokens", String(c.maxTokens));
  setVal("related-number", String(c.relatedNumber));

  const tempOutput = $(`zotero-prefpane-${config.addonRef}-temperature-output`);
  if (tempOutput) tempOutput.textContent = String(c.temperature);
}

// ---------------------------
// Helpers
// ---------------------------

function adjustTableHeight() {
  const ROW_HEIGHT = 28; // Standard Zotero row height approximation
  const HEADER_HEIGHT = 28;
  const count = addon.data.prefs?.savedConfigs.length || 0;
  // Max 5 data rows visible
  const visibleDataRows = Math.min(Math.max(count, 1), 5);
  const totalHeight = HEADER_HEIGHT + visibleDataRows * ROW_HEIGHT;

  const wrapper = $(`${config.addonRef}-table-wrapper`);
  if (wrapper) {
    wrapper.style.height = `${totalHeight}px`;
  }
}

function prefsKey(key: string) {
  return `${config.prefsPrefix}.${key}`;
}

function loadSavedConfigs(): SavedConfig[] {
  const raw = Zotero.Prefs.get(prefsKey("savedConfigs"), true) as unknown;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => normalizeConfig(v))
      .filter((v): v is SavedConfig => v !== null);
  } catch {
    return [];
  }
}

function loadMineruTokens(): string[] {
  const raw = Zotero.Prefs.get(prefsKey("mineruTokens"), true) as unknown;
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeConfig(input: any): SavedConfig | null {
  if (!input || typeof input !== "object") return null;
  return {
    apiType: String(input.apiType || ""),
    apiUrl: String(input.apiUrl || ""),
    apiKey: String(input.apiKey || ""),
    model: String(input.model || ""),
    temperature: Number(input.temperature ?? 1),
    maxTokens: Number(input.maxTokens ?? 32768),
    relatedNumber: Number(input.relatedNumber ?? 20),
  };
}

function saveConfigs(configs: SavedConfig[]) {
  Zotero.Prefs.set(prefsKey("savedConfigs"), JSON.stringify(configs), true);
}

function saveMineruTokens(tokens: string[]) {
  Zotero.Prefs.set(prefsKey("mineruTokens"), JSON.stringify(tokens), true);
}

function maskApiKey(apiKey: string) {
  const v = apiKey.trim();
  if (!v) return "";
  if (v.length <= 4) return "****";
  return `****${v.slice(-4)}`;
}

function enableVTableHorizontalScrollSync(win: Window, containerId: string) {
  const container = win.document.getElementById(
    containerId,
  ) as HTMLElement | null;
  if (!container) return;
  const key = "__vtableHScrollSyncAttached";
  if ((container as any)[key]) return;
  (container as any)[key] = true;

  let isSyncing = false;
  let rafId: number | null = null;

  const onScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target || !(target instanceof win.HTMLElement)) return;

    // Check if target is inside our container
    if (!container.contains(target)) return;

    if (isSyncing) return;

    const scrollLeft = target.scrollLeft;

    // Strategy: Sync all siblings of the scrolling element.
    // In VirtualizedTable, Header and Body are typically siblings within a wrapper.
    const parent = target.parentElement;
    if (!parent) return;

    const siblings = Array.from(parent.children).filter(
      (node): node is HTMLElement => {
        return node !== target && node instanceof win.HTMLElement;
      },
    );

    if (siblings.length === 0) return;

    if (rafId !== null) win.cancelAnimationFrame(rafId);

    rafId = win.requestAnimationFrame(() => {
      isSyncing = true;
      try {
        for (const peer of siblings) {
          if (peer.scrollLeft !== scrollLeft) {
            peer.scrollLeft = scrollLeft;
          }
        }
      } finally {
        isSyncing = false;
        rafId = null;
      }
    });
  };

  // Capture phase is essential as 'scroll' does not bubble
  container.addEventListener("scroll", onScroll, true);
}
