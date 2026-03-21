const openModalButton = document.getElementById("open-add-product-modal");
const modal = document.getElementById("add-product-modal");
const closeModalButtons = document.querySelectorAll("[data-close-modal]");
const tabTriggers = document.querySelectorAll("[data-tab-trigger]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");
const imageInput = document.getElementById("product-image");
const dropZone = document.getElementById("drop-zone");
const imagePreview = document.getElementById("image-preview");
const previewImageTag = document.getElementById("preview-image-tag");
const addProductForm = document.getElementById("add-product-form");
const productsGrid = document.getElementById("products-grid");

const setActiveTab = (tabName) => {
  tabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.tabTrigger === tabName;
    trigger.classList.toggle("bg-[#4e6bd0]", isActive);
    trigger.classList.toggle("border-[#5373d8]", isActive);
    trigger.classList.toggle("text-white", isActive);
    trigger.classList.toggle("shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]", isActive);
    trigger.classList.toggle("bg-[#eef3ff]", !isActive);
    trigger.classList.toggle("border-[#d9e4f7]", !isActive);
    trigger.classList.toggle("text-[#566ea6]", !isActive);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== tabName);
  });
};

const openModal = () => {
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
};

const resetImagePreview = () => {
  previewImageTag.src = "";
  imagePreview.classList.add("hidden");
};

const showPreview = (file) => {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    previewImageTag.src = event.target?.result ?? "";
    imagePreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
};

const createProductCard = ({ name, productKey, imageUrl }) => {
  const card = document.createElement("div");
  card.className =
    "cursor-pointer rounded-xl border border-[#e2ecf5] px-4 pt-5 pb-4 text-center transition hover:-translate-y-[3px] hover:border-ppg-blue hover:shadow-[0_6px_20px_rgba(0,91,171,0.1)]";

  const imageWrap = document.createElement("div");
  imageWrap.className = "mb-[14px] flex h-[120px] items-center justify-center";

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = name;
  image.className = "max-h-[110px] max-w-full object-contain";
  imageWrap.append(image);

  const title = document.createElement("div");
  title.className = "text-left text-[13px] leading-5 font-bold text-slate-900";
  title.textContent = name;

  const badge = document.createElement("span");
  badge.className =
    "mt-2 inline-block rounded-full bg-ppg-blue-soft px-2.5 py-[3px] text-[11px] font-bold text-ppg-blue";
  badge.textContent = productKey;

  card.append(imageWrap, title, badge);

  productsGrid?.prepend(card);
};

openModalButton?.addEventListener("click", openModal);

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

tabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setActiveTab(trigger.dataset.tabTrigger);
  });
});

imageInput?.addEventListener("change", (event) => {
  const [file] = event.target.files;
  showPreview(file);
});

dropZone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("border-[#9db3ff]", "bg-[#f8fbff]");
});

dropZone?.addEventListener("dragleave", () => {
  dropZone.classList.remove("border-[#9db3ff]", "bg-[#f8fbff]");
});

dropZone?.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("border-[#9db3ff]", "bg-[#f8fbff]");

  const [file] = event.dataTransfer.files;
  if (!file) {
    return;
  }

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  imageInput.files = dataTransfer.files;
  showPreview(file);
});

addProductForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!addProductForm.reportValidity()) {
    return;
  }

  const productName = document.getElementById("product-name")?.value.trim();
  const productKey = document.getElementById("product-key");
  const selectedKey = productKey?.options[productKey.selectedIndex]?.text ?? "Producto";
  const [imageFile] = imageInput?.files ?? [];
  const imageUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : "/img/botePintura.png";

  createProductCard({
    name: productName,
    productKey: selectedKey,
    imageUrl,
  });

  addProductForm.reset();
  resetImagePreview();
  setActiveTab("manual");
  closeModal();
});

setActiveTab("manual");
