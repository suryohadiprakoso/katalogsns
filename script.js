// Memastikan semua elemen HTML telah dimuat sebelum menjalankan script
document.addEventListener("DOMContentLoaded", () => {
  // Mendapatkan referensi ke elemen-elemen DOM yang dibutuhkan
  const productGrid = document.getElementById("productGrid");
  const loader = document.getElementById("loader");

  // Desktop Search Input
  const searchInputDesktop = document.getElementById("searchInputDesktop");
  // Mobile Search Input
  const searchInputMobile = document.getElementById("searchInputMobile");

  // Kontainer Filter Brand (Desktop & Mobile)
  const brandFiltersDesktop = document.getElementById("brandFiltersDesktop");
  const brandFiltersMobile = document.getElementById("brandFiltersMobile");

  // Kontainer Filter Status (Desktop & Mobile)
  const statusFiltersDesktop = document.getElementById("statusFiltersDesktop");
  const statusFiltersMobile = document.getElementById("statusFiltersMobile");

  // Kontainer Filter HET (Desktop & Mobile)
  const hetFiltersDesktop = document.getElementById("hetFiltersDesktop");
  const hetFiltersMobile = document.getElementById("hetFiltersMobile");

  const darkModeToggle = document.getElementById("darkModeToggle");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  const backToTopBtn = document.getElementById("backToTopBtn");
  const mainNavbar = document.getElementById("mainNavbar");
  const desktopFilterSection = document.getElementById("desktopFilterSection"); // Bagian filter desktop yang fixed

  // Referensi ke tombol filter mobile dan bagian filter collapsible mobile
  const mobileFilterToggleButton = document.querySelector(
    '[data-collapse-toggle="navbar-search"]'
  );
  const navbarSearch = document.getElementById("navbar-search");

  // Referensi ke tombol filter desktop dan bagian filter collapsible desktop
  const desktopFilterToggleButton = document.querySelector(
    '[data-collapse-toggle="desktopFilterCollapse"]'
  );
  const desktopFilterCollapse = document.getElementById(
    "desktopFilterCollapse"
  );

  // URL Google Sheet yang telah dipublikasikan sebagai CSV
  // PENTING: Ganti URL ini dengan URL CSV publik yang Anda dapatkan dari "File > Bagikan > Publikasikan ke web"
  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzoN01n6iTJQLnorjqNlHPjCe0H8LMP0GL78TqW8ErXp_VB20YtPkPG1HgyY21_MIEpsMWd7X4w4RX/pub?output=csv";

  let allProducts = [];
  let filteredProducts = [];

  let activeFilters = {
    brand: "all",
    status: "all",
    het: "all",
  };

  /**
   * Fungsi untuk menyesuaikan padding body berdasarkan tinggi navbar utama dan bagian filter desktop.
   */
  const adjustLayout = () => {
    if (mainNavbar && document.body) {
      const navbarHeight = mainNavbar.offsetHeight;
      let totalFixedContentHeight = navbarHeight;

      // Jika di desktop dan desktopFilterSection ada
      if (window.innerWidth >= 768 && desktopFilterSection) {
        desktopFilterSection.style.top = `${navbarHeight}px`; // Posisikan tepat di bawah navbar

        // Hanya tambahkan tinggi desktopFilterCollapse jika tidak hidden
        if (
          desktopFilterCollapse &&
          !desktopFilterCollapse.classList.contains("hidden")
        ) {
          totalFixedContentHeight += desktopFilterCollapse.offsetHeight;
        }
      } else if (desktopFilterSection) {
        // Sembunyikan sepenuhnya di luar layar saat tidak aktif (mobile)
        desktopFilterSection.style.top = `-9999px`;
      }

      // Set padding-top untuk body untuk mengakomodasi semua elemen fixed
      document.body.style.paddingTop = `${totalFixedContentHeight + 16}px`; // +16px untuk sedikit margin

      console.log(`Navbar Height: ${navbarHeight}px`);
      if (window.innerWidth >= 768 && desktopFilterSection) {
        console.log(
          `Desktop Filter Section Height: ${desktopFilterSection.offsetHeight}px`
        );
        if (desktopFilterCollapse) {
          console.log(
            `Desktop Filter Collapse Height: ${desktopFilterCollapse.offsetHeight}px`
          );
        }
      }
      console.log(`Body Padding Top: ${document.body.style.paddingTop}`);
    } else {
      console.warn(
        "Main navbar or body element not found. Layout adjustment skipped."
      );
    }
  };

  /**
   * Fungsi untuk menginisialisasi Dark Mode.
   */
  const initDarkMode = () => {
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedMode === "dark" || (savedMode === null && prefersDark)) {
      document.body.classList.add("dark-mode");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    } else {
      document.body.classList.remove("dark-mode");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    }
    adjustLayout();
  };

  /**
   * Fungsi untuk mengaktifkan/menonaktifkan Dark Mode.
   */
  const toggleDarkMode = () => {
    if (document.body.classList.contains("dark-mode")) {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "light");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "dark");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
    adjustLayout();
  };

  // Event listener untuk tombol Dark Mode
  darkModeToggle.addEventListener("click", toggleDarkMode);
  initDarkMode();

  /**
   * Fungsi untuk memformat angka menjadi format mata uang Rupiah (IDR).
   */
  const formatRupiah = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return "Rp 0";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numericAmount);
  };

  /**
   * Fungsi untuk menampilkan daftar produk di grid.
   */
  const displayProducts = (productsToDisplay) => {
    productGrid.innerHTML = "";
    if (productsToDisplay.length === 0) {
      productGrid.innerHTML =
        '<p class="text-center text-gray-600 dark:text-gray-400 col-span-full">Produk tidak ditemukan.</p>';
      return;
    }

    productsToDisplay.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      let statusBgColor = "bg-gray-500";
      if (product.status && product.status.toLowerCase() === "new") {
        statusBgColor = "bg-blue-500";
      } else if (
        product.status &&
        product.status.toLowerCase() === "best seller"
      ) {
        statusBgColor = "bg-yellow-500";
      } else if (product.status && product.status.toLowerCase() === "promo") {
        statusBgColor = "bg-pink-500";
      }

      const productInfoLine = `${product.sku}/${product.name}${
        product.isi ? ` - ${product.isi}` : ""
      }`;

      productCard.innerHTML = `
                ${
                  product.status
                    ? `<div class="product-status-label ${statusBgColor}">${product.status}</div>`
                    : ""
                }
                <div class="product-top-right-labels">
                    ${
                      product.brand
                        ? `<div class="product-brand-label">${product.brand}</div>`
                        : ""
                    }
                </div>
                <img src="${product.imageUrl}" alt="${
        product.name
      }" class="product-image" onerror="this.onerror=null;this.src='${
        product.placeholderUrl
      }'; console.error('Gagal memuat gambar:', '${product.imageUrl}');">
                ${
                  product.hetLabel
                    ? `<div class="product-het-label-on-image">HET ${product.hetLabel}</div>`
                    : ""
                }
                <div class="p-4">
                    <p class="text-xs text-gray-700 dark:text-gray-300 mb-1">${productInfoLine} | ${
        product.satuan || "pcs"
      }</p>
                    <div class="flex flex-col text-sm mb-2">
                        ${
                          product.ctnPrice > 0
                            ? `
                            <span class="text-gray-900 dark:text-white font-semibold">
                                Harga Karton: ${formatRupiah(product.ctnPrice)}
                            </span>
                        `
                            : ""
                        }
                        ${
                          product.packPrice > 0
                            ? `
                            <span class="text-gray-900 dark:text-white font-semibold">
                                Harga Pack: ${formatRupiah(product.packPrice)}
                            </span>
                        `
                            : ""
                        }
                        ${
                          product.pcsPrice > 0
                            ? `
                            <span class="text-gray-900 dark:text-white font-semibold">
                                Harga Pcs: ${formatRupiah(product.pcsPrice)}
                            </span>
                        `
                            : ""
                        }
                    </div>
                </div>
            `;
      productGrid.appendChild(productCard);
    });
  };

  /**
   * Fungsi untuk mengurai teks CSV menjadi array of objek JavaScript.
   */
  const parseCSV = (csvText) => {
    const lines = csvText
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== "");
    if (lines.length === 0) return [];

    const CSV_REGEX = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;

    const extractFields = (line) => {
      let fields = [];
      let match;
      while ((match = CSV_REGEX.exec(line)) !== null) {
        fields.push(match[1] !== undefined ? match[1] : match[2]);
      }
      return fields.map((field) => (field ? field.trim() : ""));
    };

    const headerLine = lines[0];
    const headers = extractFields(headerLine);
    return lines.slice(1).map((line) => {
      const currentLineFields = extractFields(line);
      const item = {};
      headers.forEach((header, i) => {
        item[header] = currentLineFields[i] || "";
      });
      return item;
    });
  };

  /**
   * Fungsi untuk mengaplikasikan semua filter dan pencarian.
   * Memperhitungkan input pencarian desktop atau mobile yang aktif.
   */
  const applyFiltersAndSearch = () => {
    let currentProducts = [...allProducts];

    let searchTerm = "";
    if (window.innerWidth >= 768 && searchInputDesktop) {
      // Desktop view
      searchTerm = searchInputDesktop.value.toLowerCase().trim();
    } else if (searchInputMobile) {
      // Mobile view
      searchTerm = searchInputMobile.value.toLowerCase().trim();
    }

    // 1. Filter berdasarkan Brand
    if (activeFilters.brand !== "all") {
      currentProducts = currentProducts.filter(
        (product) =>
          product.brand &&
          product.brand.toLowerCase() === activeFilters.brand.toLowerCase()
      );
    }

    // 2. Filter berdasarkan Status
    if (activeFilters.status !== "all") {
      currentProducts = currentProducts.filter(
        (product) =>
          product.status &&
          product.status.toLowerCase() === activeFilters.status.toLowerCase()
      );
    }

    // 3. Filter berdasarkan HET
    if (activeFilters.het !== "all") {
      currentProducts = currentProducts.filter((product) => {
        const het = product.hetPrice;
        if (het === null || isNaN(het)) return false;

        switch (activeFilters.het) {
          case "<500":
            return het <= 500;
          case "500-2000":
            return het > 500 && het <= 2000;
          case ">2000":
            return het > 2000;
          default:
            return true;
        }
      });
    }

    // 4. Filter berdasarkan Pencarian
    if (searchTerm) {
      currentProducts = currentProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
          (product.status && product.status.toLowerCase().includes(searchTerm))
      );
    }

    filteredProducts = currentProducts;
    displayProducts(filteredProducts);
    updateFilterButtonStates(); // Perbarui status aktif tombol filter setelah filter diterapkan
  };

  /**
   * Fungsi untuk memperbarui status 'active' pada tombol filter di kedua set (desktop dan mobile).
   */
  const updateFilterButtonStates = () => {
    // Brands
    [brandFiltersDesktop, brandFiltersMobile].forEach((container) => {
      if (container) {
        container.querySelectorAll(".filter-btn").forEach((btn) => {
          if (btn.dataset.filterValue === activeFilters.brand) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
      }
    });

    // Status
    [statusFiltersDesktop, statusFiltersMobile].forEach((container) => {
      if (container) {
        container.querySelectorAll(".filter-btn").forEach((btn) => {
          if (btn.dataset.filterValue === activeFilters.status) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
      }
    });

    // HET
    [hetFiltersDesktop, hetFiltersMobile].forEach((container) => {
      if (container) {
        container.querySelectorAll(".filter-btn").forEach((btn) => {
          if (btn.dataset.filterValue === activeFilters.het) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
      }
    });
  };

  /**
   * Fungsi untuk membuat tombol filter dinamis dan menambahkan event listener.
   * @param {HTMLElement} container - Elemen DOM tempat tombol akan ditambahkan.
   * @param {Array<string>} values - Nilai unik untuk tombol.
   * @param {string} filterType - Tipe filter (e.g., 'brand', 'status').
   */
  const createFilterButtons = (container, values, filterType) => {
    if (!container) return; // Pastikan kontainer ada

    // Hapus semua tombol kecuali tombol 'ALL' yang sudah ada di HTML
    container
      .querySelectorAll('button:not([data-filter-value="all"])')
      .forEach((btn) => btn.remove());

    values.sort().forEach((value) => {
      if (value) {
        const button = document.createElement("button");
        button.className = "filter-btn";
        button.dataset.filterType = filterType;
        button.dataset.filterValue = value.toLowerCase();
        button.textContent = value;
        container.appendChild(button);
      }
    });
  };

  /**
   * Menambahkan event listener untuk semua tombol filter yang dibuat dinamis.
   * @param {HTMLElement} container - Kontainer tempat tombol filter berada.
   * @param {string} filterType - Tipe filter ('brand', 'status', 'het').
   */
  const addFilterButtonListeners = (container, filterType) => {
    if (container) {
      container.addEventListener("click", (e) => {
        const clickedButton = e.target.closest(".filter-btn");
        if (clickedButton && clickedButton.dataset.filterType === filterType) {
          activeFilters[filterType] = clickedButton.dataset.filterValue;
          applyFiltersAndSearch();
        }
      });
    }
  };

  const loadProducts = async () => {
    loader.style.display = "block";
    productGrid.innerHTML = "";

    try {
      const response = await fetch(SHEET_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      const rawProducts = parseCSV(csvText);

      allProducts = rawProducts
        .map((item, index) => {
          const productSKU = item["SKU"] || `SKU-${index + 1}`;
          const productName = item["Nama Produk"] || `Produk #${index + 1}`;

          const rawPackPrice = item["Harga Pack"]
            ? String(item["Harga Pack"]).replace(/,/g, "")
            : "0";
          const productPackPrice = parseFloat(rawPackPrice) || 0;

          const rawPcsPrice = item["Harga Pcs"]
            ? String(item["Harga Pcs"]).replace(/,/g, "")
            : "0";
          const productPcsPrice = parseFloat(rawPcsPrice) || 0;

          const rawCtnPrice = item["Harga Ctn"]
            ? String(item["Harga Ctn"]).replace(/,/g, "")
            : "0";
          const productCtnPrice = parseFloat(rawCtnPrice) || 0;

          const rawHET = item["HET"]
            ? String(item["HET"]).replace(/,/g, "")
            : "";
          const productHET = rawHET ? parseFloat(rawHET) : null;
          const productHETLabel =
            productHET !== null ? formatRupiah(productHET) : null;

          const imageFileName = item["IMG File"] || "";
          const productStatusLabel = item["Status"] || "";
          const productBrand = item["Brand"] || "";
          const productSatuan = item["Satuan"] || "pcs";
          const productIsi = item["Isi"] || "";

          return {
            sku: productSKU,
            name: productName,
            packPrice: productPackPrice,
            pcsPrice: productPcsPrice,
            ctnPrice: productCtnPrice,
            hetPrice: productHET,
            hetLabel: productHETLabel,
            status: productStatusLabel,
            brand: productBrand,
            satuan: productSatuan,
            isi: productIsi,
            imageUrl: imageFileName
              ? `./images/${imageFileName}`
              : `https://placehold.co/600x400/CCCCCC/333333?text=${encodeURIComponent(
                  productName
                )}`,
            placeholderUrl: `https://placehold.co/600x400/CCCCCC/333333?text=${encodeURIComponent(
              productName
            )}`,
          };
        })
        .filter((product) => product.name);

      const uniqueBrands = [
        ...new Set(allProducts.map((p) => p.brand).filter((b) => b)),
      ];
      const uniqueStatuses = [
        ...new Set(allProducts.map((p) => p.status).filter((s) => s)),
      ];

      // Buat tombol filter untuk desktop dan mobile
      createFilterButtons(brandFiltersDesktop, uniqueBrands, "brand");
      createFilterButtons(brandFiltersMobile, uniqueBrands, "brand");
      createFilterButtons(statusFiltersDesktop, uniqueStatuses, "status");
      createFilterButtons(statusFiltersMobile, uniqueStatuses, "status");

      // Tambahkan event listener untuk kedua set filter
      addFilterButtonListeners(brandFiltersDesktop, "brand");
      addFilterButtonListeners(brandFiltersMobile, "brand");
      addFilterButtonListeners(statusFiltersDesktop, "status");
      addFilterButtonListeners(statusFiltersMobile, "status");
      addFilterButtonListeners(hetFiltersDesktop, "het");
      addFilterButtonListeners(hetFiltersMobile, "het");

      applyFiltersAndSearch();
    } catch (error) {
      console.error("Error fetching or parsing products:", error);
      productGrid.innerHTML =
        '<p class="text-center text-red-500 dark:text-red-300 col-span-full">Gagal memuat produk. Pastikan URL Google Sheet benar, nama kolom sesuai, dan file gambar ada di folder "images".</p>';
    } finally {
      loader.style.display = "none";
      adjustLayout();
    }
  };

  // Event listener untuk input pencarian desktop
  if (searchInputDesktop) {
    searchInputDesktop.addEventListener("keyup", applyFiltersAndSearch);
  }
  // Event listener untuk input pencarian mobile
  if (searchInputMobile) {
    searchInputMobile.addEventListener("keyup", applyFiltersAndSearch);
  }

  // Event listener untuk tombol filter mobile (Tombol "Filter" baru)
  if (mobileFilterToggleButton && navbarSearch) {
    mobileFilterToggleButton.addEventListener("click", () => {
      setTimeout(() => {
        navbarSearch.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  }

  // Event listener untuk tombol filter desktop yang baru
  if (desktopFilterToggleButton && desktopFilterCollapse) {
    desktopFilterToggleButton.addEventListener("click", () => {
      // Flowbite akan menangani toggling kelas 'hidden'
      // Setelah toggle, panggil adjustLayout untuk memperbarui padding
      setTimeout(() => {
        adjustLayout();
        // Setelah filter tergulir, fokuskan ke bagian filter itu sendiri
        if (!desktopFilterCollapse.classList.contains("hidden")) {
          desktopFilterCollapse.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100); // Beri sedikit waktu untuk transisi Flowbite
    });
  }

  loadProducts();

  window.addEventListener("resize", () => {
    adjustLayout();
    // Saat ukuran jendela berubah, pastikan status tombol filter diperbarui
    updateFilterButtonStates();
  });

  // Logika untuk tombol Back to Top
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 200) {
      backToTopBtn.classList.remove("hidden");
    } else {
      backToTopBtn.classList.add("hidden");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});
