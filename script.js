function switchView(viewId) {
    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(panel => panel.classList.add('hidden'));

    const target = document.getElementById('view-' + viewId);
    if (target) {
        target.classList.remove('hidden');
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('bg-[#A5D6A7]/60', 'text-[#1B5E20]', 'font-semibold');
        item.classList.add('text-[#2E7D32]');
    });

    const activeNav = document.getElementById('nav-' + viewId);
    if (activeNav) {
        activeNav.classList.remove('text-[#2E7D32]');
        activeNav.classList.add('bg-[#A5D6A7]/60', 'text-[#1B5E20]', 'font-semibold');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function handleFormSubmit(event, modalId, message) {
    event.preventDefault();
    closeModal(modalId);
    triggerToast(message, 'success');
}

function handleLoginSubmit(event) {
    event.preventDefault();
    switchView('dashboard');
    triggerToast('Welcome to AgriBorrow System, Admin Juan!', 'success');
}

function filterEquipmentTable() {
    const searchVal = document.getElementById('tableSearchInput').value.toLowerCase();
    const statusVal = document.getElementById('statusFilter').value.toUpperCase();
    const table = document.getElementById('equipmentTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const rowText = rows[i].innerText.toLowerCase();
        const matchesSearch = rowText.includes(searchVal);
        const matchesStatus = (statusVal === 'ALL') || rowText.toUpperCase().includes(statusVal);

        if (matchesSearch && matchesStatus) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

function filterGlobalSearch() {
    const searchVal = document.getElementById('globalSearchInput').value.toLowerCase();
    if (searchVal.length > 2) {
        switchView('dashboard');
        document.getElementById('tableSearchInput').value = searchVal;
        filterEquipmentTable();
    }
}

function triggerToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMsg');
    const toastBody = document.getElementById('toastBody');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.innerText = message;

    if (type === 'success') {
        toastBody.className = 'bg-[#2E7D32] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-3 text-xs font-medium';
        toastIcon.className = 'fa-solid fa-circle-check text-base';
    } else if (type === 'warning') {
        toastBody.className = 'bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-3 text-xs font-medium';
        toastIcon.className = 'fa-solid fa-triangle-exclamation text-base';
    } else {
        toastBody.className = 'bg-[#1B5E20] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-3 text-xs font-medium';
        toastIcon.className = 'fa-solid fa-circle-info text-base';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// ==========================================
// CIS 104: DATABASE DYNAMIC FARMER FUNCTIONS
// ==========================================

// 1. Kunin ang mga Farmers mula sa MySQL Database papunta sa Dropdown
function loadFarmersDropdown() {
    const selectElement = document.getElementById('farmerSelect');
    if (!selectElement) return;

    fetch('backend/get_farmers.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                selectElement.innerHTML = '';

                // Default Option
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "-- Select Registered Farmer --";
                selectElement.appendChild(defaultOption);

                // Option para magdagdag ng bagong farmer
                const addNewOption = document.createElement('option');
                addNewOption.value = "ADD_NEW";
                addNewOption.textContent = "➕ + Add New Farmer";
                selectElement.appendChild(addNewOption);

                // I-load ang mga totoong records galing sa Farmer Table ng SQL
                data.data.forEach(farmer => {
                    const opt = document.createElement('option');
                    opt.value = farmer.farmer_id; // gagamitin ang primary key sa DB
                    opt.textContent = `${farmer.first_name} ${farmer.last_name} (${farmer.farm_name || 'No Farm Name'})`;
                    selectElement.appendChild(opt);
                });
            }
        })
        .catch(err => console.error("Database connection error:", err));
}

// 2. I-check kung pinili ang "+ Add New Farmer" para buksan ang Add Farmer Modal Form
function handleFarmerSelection(selectObj) {
    if (selectObj.value === "ADD_NEW") {
        openModal('modalAddFarmer'); // Buksan ang form para sa bagong farmer
        selectObj.value = ""; // I-reset muna ang dropdown
    }
}

// 3. I-save ang bagong Farmer papunta sa MySQL Database gamit ang PHP backend
function saveNewFarmer(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('addFarmerForm'));

    fetch('backend/add_farmer.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal('modalAddFarmer');
            triggerToast(data.message, 'success');
            loadFarmersDropdown(); // Automatic na i-r-refresh ang dropdown para lumabas agad ang bagong farmer!
            document.getElementById('addFarmerForm').reset();
        } else {
            triggerToast('Error: ' + data.message, 'warning');
        }
    })
    .catch(err => {
        console.error("Error saving farmer:", err);
        triggerToast('Failed to connect to database.', 'warning');
    });
}

// Automatic na i-load ang mga farmers kapag nagbukas ang website
document.addEventListener("DOMContentLoaded", function() {
    loadFarmersDropdown();
});

// ==========================================
// CIS 104: DYNAMIC EQUIPMENT & CATEGORY FUNCTIONS
// ==========================================

// 1. Kunin ang listahan ng Equipment mula sa Database at ipakita sa Table ng Dashboard/Equipment
function loadEquipmentTable() {
    const tableBody = document.querySelector('#equipmentTable tbody');
    if (!tableBody) return;

    fetch('backend/get_equipment.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                tableBody.innerHTML = ''; // Linisin muna ang table

                if (data.data.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">No equipment found in the database.</td></tr>`;
                    return;
                }

                data.data.forEach(item => {
                    // Ayusin ang kulay ng status badge base sa database status
                    let statusBadge = '';
                    if (item.availability_status === 'AVAILABLE') {
                        statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold">AVAILABLE</span>`;
                    } else {
                        statusBadge = `<span class="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-1 rounded-full font-bold">${item.availability_status}</span>`;
                    }

                    // Gumawa ng HTML row para sa bawat equipment sa database
                    const row = document.createElement('tr');
                    row.className = "hover:bg-[#E8F5E9]/20 transition";
                    row.innerHTML = `
                        <td class="p-3.5 pl-5 font-mono text-xs font-bold text-[#2E7D32]">${item.equipment_code}</td>
                        <td class="p-3.5 font-semibold text-[#1B5E20]">${item.equipment_name} <br><span class="text-[10px] text-gray-500 font-normal">Model: ${item.model || 'N/A'}</span></td>
                        <td class="p-3.5">${item.category_name}</td>
                        <td class="p-3.5"><span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-semibold">${item.condition_status}</span></td>
                        <td class="p-3.5">${statusBadge}</td>
                        <td class="p-3.5 text-center space-x-2">
                            <button onclick="openModal('modalBorrow')" class="text-[#2E7D32] hover:text-[#1B5E20] font-medium text-xs bg-[#E8F5E9] px-2.5 py-1 rounded-lg border border-[#A5D6A7]">Borrow</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        })
        .catch(err => console.error("Error loading equipment table:", err));
}

// 2. Kunin ang mga Categories para sa Dropdown ng Add Equipment Form
function loadCategoriesDropdown() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;

    fetch('backend/get_categories.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
                data.data.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.category_id; // gagamitin ang category_id bilang foreign key
                    opt.textContent = cat.category_name;
                    categorySelect.appendChild(opt);
                });
            }
        })
        .catch(err => console.error("Error loading categories:", err));
}

// 3. I-save ang bagong Equipment galing sa Modal Form papunta sa MySQL Database
function saveNewEquipment(event) {
    event.preventDefault();
    const formData = new FormData(document.getElementById('addEquipmentForm'));

    fetch('backend/add_equipment.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            closeModal('modalAddEquipment');
            triggerToast(data.message, 'success');
            loadEquipmentTable(); // I-refresh agad ang table para makita ang bagong equipment!
            document.getElementById('addEquipmentForm').reset();
        } else {
            triggerToast('Error: ' + data.message, 'warning');
        }
    })
    .catch(err => {
        console.error("Error saving equipment:", err);
        triggerToast('Failed to connect to database.', 'warning');
    });
}

// Automatic na i-load ang equipment table at categories kapag nagbukas ang page
document.addEventListener("DOMContentLoaded", function() {
    loadEquipmentTable();
    loadCategoriesDropdown();
});