(() => {
    const toc = document.querySelector("[data-article-toc]");
    if (!toc) return;

    const headings = Array.from(document.querySelectorAll(".article-body h2, .article-body h3"));
    if (headings.length < 3) return;

    const list = toc.querySelector("ol");
    const usedIds = new Set();

    headings.forEach((heading, index) => {
        let baseId = heading.id || heading.textContent
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-") || `section-${index + 1}`;
        let id = baseId;
        let suffix = 2;

        while (usedIds.has(id) || (document.getElementById(id) && document.getElementById(id) !== heading)) {
            id = `${baseId}-${suffix++}`;
        }

        heading.id = id;
        usedIds.add(id);

        const item = document.createElement("li");
        if (heading.tagName === "H3") item.className = "toc-subitem";

        const link = document.createElement("a");
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        item.appendChild(link);
        list.appendChild(item);
    });

    toc.hidden = false;
})();
