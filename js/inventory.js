// Current state
let currentWarehouses = [];
let currentRacks = [];
let currentShelves = [];
let currentBoxes = [];
let currentItems = [];

// Initialize page
// Add to the beginning of window.onload in inventory.js
window.onload = async () => {
    await protectPage();
    loadUser();
    await loadWarehousesForDropdowns();
    await loadAllEntities();
    loadActivity();
    await loadInventoryTree();
    
    // Initialize move section
    await initializeMoveSection();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const rackId = urlParams.get('rack');
    const warehouseId = urlParams.get('warehouse');
    
    if (tab) {
        // Switch to the specified tab
        switchTab(tab);
        
        // If rack is specified, pre-select it
        if (tab === 'racks' && rackId) {
            console.log('Should focus on rack:', rackId);
        }
    }
};

async function getOrgId() {
    const orgId = sessionStorage.getItem('orgId');
    if (!orgId) {
        console.error('No organization ID found in session');
        // Try to get it from user profile
        const profile = await getUserRole();
        if (profile) {
            const newOrgId = profile.organization_id || profile.id;
            sessionStorage.setItem('orgId', newOrgId);
            return newOrgId;
        }
    }
    return orgId;
}

// Add this new function to initialize the move section
async function initializeMoveSection() {
    try {
        await loadMoveItemsDropdown();
        await loadDestinationWarehouses();
        console.log("Move section initialized successfully");
    } catch (err) {
        console.error("Error initializing move section:", err);
    }
}



// Load all entities
async function loadAllEntities() {
    await Promise.all([
        loadWarehousesList(),
        loadRacksList(),
        loadShelvesList(),
        loadBoxesList(),
        loadItemsList()
    ]);
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // If switching to items tab, reload the move items dropdown
    if (tabName === 'items') {
        loadMoveItemsDropdown();
        loadDestinationWarehouses();
    }
}



// Load warehouses for dropdowns
async function loadWarehousesForDropdowns() {
    const orgId = await getOrgId();
    if (!orgId) {
        console.error("No orgId found");
        return;
    }
    
    const { data, error } = await supabaseClient
        .from("warehouses")
        .select("id, name")
        .eq('organization_id', orgId)
        .order("name");

    if (error) {
        console.error("Error loading warehouses:", error);
        return;
    }

    // Update all warehouse dropdowns
    const dropdowns = [
        "rackWarehouse", "shelfWarehouse", "boxWarehouse", 
        "itemWarehouse", "moveWarehouse"
    ];

    dropdowns.forEach(dropdownId => {
        const select = document.getElementById(dropdownId);
        if (select) {
            select.innerHTML = '<option value="">Select Warehouse</option>';
            if (data && data.length > 0) {
                data.forEach(w => {
                    select.innerHTML += `<option value="${w.id}">${w.name}</option>`;
                });
            }
        }
    });
}

// Load racks for shelf dropdown
async function loadRacksForShelf() {
    const warehouseId = document.getElementById("shelfWarehouse").value;
    const orgId = await getOrgId();
    
    if (!warehouseId) return;

    let query = supabaseClient
        .from("racks")
        .select("id, name")
        .eq("warehouse_id", warehouseId);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading racks:", error);
        return;
    }

    const select = document.getElementById("shelfRack");
    select.innerHTML = '<option value="">Select Rack</option>';
    data.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}

// Load racks for box
async function loadRacksForBox() {
    const warehouseId = document.getElementById("boxWarehouse").value;
    const orgId = await getOrgId();
    
    if (!warehouseId) return;

    let query = supabaseClient
        .from("racks")
        .select("id, name")
        .eq("warehouse_id", warehouseId);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading racks:", error);
        return;
    }

    const select = document.getElementById("boxRack");
    select.innerHTML = '<option value="">Select Rack</option>';
    data.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}

// Load shelves for box
async function loadShelvesForBox() {
    const rackId = document.getElementById("boxRack").value;
    const orgId = await getOrgId();
    
    if (!rackId) return;

    let query = supabaseClient
        .from("shelves")
        .select("id, name")
        .eq("rack_id", rackId);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading shelves:", error);
        return;
    }

    const select = document.getElementById("boxShelf");
    select.innerHTML = '<option value="">Select Shelf</option>';
    data.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// Load racks for item
async function loadRacksForItem() {
    const warehouseId = document.getElementById("itemWarehouse").value;
    if (!warehouseId) return;

    const { data, error } = await supabaseClient
        .from("racks")
        .select("id, name")
        .eq("warehouse_id", warehouseId)
        .order("name");

    if (error) {
        console.error("Error loading racks:", error);
        return;
    }

    const select = document.getElementById("itemRack");
    select.innerHTML = '<option value="">Select Rack</option>';
    data.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}

// Load shelves for item
async function loadShelvesForItem() {
    const rackId = document.getElementById("itemRack").value;
    if (!rackId) return;

    const { data, error } = await supabaseClient
        .from("shelves")
        .select("id, name")
        .eq("rack_id", rackId)
        .order("name");

    if (error) {
        console.error("Error loading shelves:", error);
        return;
    }

    const select = document.getElementById("itemShelf");
    select.innerHTML = '<option value="">Select Shelf</option>';
    data.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
    
    // Clear box dropdown
    document.getElementById("itemBox").innerHTML = '<option value="">(Optional) Select Box</option>';
}

// Load boxes for item
async function loadBoxesForItem() {
    const shelfId = document.getElementById("itemShelf").value;
    if (!shelfId) return;

    const { data, error } = await supabaseClient
        .from("boxes")
        .select("id, name")
        .eq("shelf_id", shelfId)
        .order("name");

    if (error) {
        console.error("Error loading boxes:", error);
        return;
    }

    const select = document.getElementById("itemBox");
    select.innerHTML = '<option value="">(Optional) Select Box</option>';
    data.forEach(b => {
        select.innerHTML += `<option value="${b.id}">${b.name}</option>`;
    });
}

// Load destination racks for move
async function loadDestinationRacks() {
    const warehouseId = document.getElementById("moveWarehouse").value;
    const orgId = await getOrgId();
    
    if (!warehouseId) return;

    let query = supabaseClient
        .from("racks")
        .select("id, name")
        .eq("warehouse_id", warehouseId);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading racks:", error);
        return;
    }

    const select = document.getElementById("moveRack");
    select.innerHTML = '<option value="">Select Rack</option>';
    data.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}


// Load destination shelves for move
async function loadDestinationShelves() {
    const rackId = document.getElementById("moveRack").value;
    const orgId = await getOrgId();
    
    if (!rackId) return;

    let query = supabaseClient
        .from("shelves")
        .select("id, name")
        .eq("rack_id", rackId);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading shelves:", error);
        return;
    }

    const select = document.getElementById("moveShelf");
    select.innerHTML = '<option value="">Select Shelf</option>';
    data.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}


// Load destination boxes for move
async function loadDestinationBoxes() {
    const shelfId = document.getElementById("moveShelf").value;
    const orgId = await getOrgId();
    
    if (!shelfId) return;

    let query = supabaseClient
        .from("boxes")
        .select("id, name")
        .eq("shelf_id", shelfId);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading boxes:", error);
        return;
    }

    const select = document.getElementById("moveBox");
    select.innerHTML = '<option value="">(Optional) Select Box</option>';
    data.forEach(b => {
        select.innerHTML += `<option value="${b.id}">${b.name}</option>`;
    });
}

// WAREHOUSE FUNCTIONS
async function addWarehouse() {
    const name = document.getElementById("warehouseName").value;
    const description = document.getElementById("warehouseDesc").value;
    const orgId = await getOrgId();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!name) {
        alert("Please enter a warehouse name");
        return;
    }

    const { data, error } = await supabaseClient
        .from("warehouses")
        .insert([{ 
            name, 
            description,
            organization_id: orgId,
            created_by: user.id  // Add created_by
        }])
        .select();

    if (error) {
        alert("Error adding warehouse: " + error.message);
        return;
    }

    await logActivity('INSERT', 'warehouses', data[0].id, `Added warehouse "${name}"`);
    
    alert("Warehouse added successfully!");
    document.getElementById("warehouseName").value = "";
    document.getElementById("warehouseDesc").value = "";
    
    loadWarehousesList();
    loadWarehousesForDropdowns();
    await loadInventoryTree();
}


async function loadWarehousesList() {
    const orgId = await getOrgId();
    let query = supabaseClient.from("warehouses").select("*");
    
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading warehouses:", error);
        return;
    }

    currentWarehouses = data || [];
    displayWarehouses(data || []);
}

function displayWarehouses(warehouses) {
    const container = document.getElementById("warehouseList");
    container.innerHTML = "";

    if (warehouses.length === 0) {
        container.innerHTML = '<p class="loading">No warehouses found</p>';
        return;
    }

    warehouses.forEach(w => {
        const div = document.createElement("div");
        div.className = "entity-item";
        div.innerHTML = `
            <div class="entity-info">
                <div class="entity-name">${w.name}</div>
                <div class="entity-details">${w.description || 'No description'}</div>
            </div>
            <div class="entity-actions">
                <button class="btn btn-small btn-primary" onclick="editWarehouse('${w.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteWarehouse('${w.id}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterWarehouses() {
    const searchTerm = document.getElementById("warehouseSearch").value.toLowerCase();
    const filtered = currentWarehouses.filter(w => 
        w.name.toLowerCase().includes(searchTerm) || 
        (w.description && w.description.toLowerCase().includes(searchTerm))
    );
    displayWarehouses(filtered);
}

async function editWarehouse(id) {
    const warehouse = currentWarehouses.find(w => w.id === id);
    
    document.getElementById("modalTitle").innerText = "Edit Warehouse";
    document.getElementById("modalBody").innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editName" value="${warehouse.name}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editDesc">${warehouse.description || ''}</textarea>
        </div>
        <button class="btn btn-success" onclick="updateWarehouse('${id}')">Update</button>
    `;
    
    document.getElementById("editModal").style.display = "block";
}

async function updateWarehouse(id) {
    const name = document.getElementById("editName").value;
    const description = document.getElementById("editDesc").value;

    if (!name) {
        alert("Please enter a name");
        return;
    }

    const { error } = await supabaseClient
        .from("warehouses")
        .update({ name, description })
        .eq("id", id);

    if (error) {
        alert("Error updating warehouse: " + error.message);
        return;
    }

    await logActivity('UPDATE', 'warehouses', id, `Updated warehouse "${name}"`);
    
    alert("Warehouse updated successfully!");
    closeModal();
    loadWarehousesList();
    loadWarehousesForDropdowns();
    await loadInventoryTree();
}

async function deleteWarehouse(id) {
    if (!confirm("Are you sure you want to delete this warehouse? This will also delete all racks, shelves, boxes, and items in it!")) {
        return;
    }

    const warehouse = currentWarehouses.find(w => w.id === id);
    
    const { error } = await supabaseClient
        .from("warehouses")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error deleting warehouse: " + error.message);
        return;
    }

    await logActivity('DELETE', 'warehouses', id, `Deleted warehouse "${warehouse.name}"`);
    
    alert("Warehouse deleted successfully!");
    loadWarehousesList();
    loadWarehousesForDropdowns();
    await loadInventoryTree();
}

// RACK FUNCTIONS
async function addRack() {
    const orgId = await getOrgId();
    const warehouse_id = document.getElementById("rackWarehouse").value;
    const name = document.getElementById("rackName").value;
    const description = document.getElementById("rackDesc").value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!warehouse_id) {
        alert("Please select a warehouse");
        return;
    }

    if (!name) {
        alert("Please enter a rack name");
        return;
    }

    const { data, error } = await supabaseClient
        .from("racks")
        .insert([{ 
            name, 
            description, 
            warehouse_id,
            organization_id: orgId,
            created_by: user.id  // Add created_by
        }])
        .select();

    if (error) {
        alert("Error adding rack: " + error.message);
        return;
    }

    // Get warehouse name for activity log
    const { data: warehouse } = await supabaseClient
        .from("warehouses")
        .select("name")
        .eq("id", warehouse_id)
        .single();

    await logActivity('INSERT', 'racks', data[0].id, `Added rack "${name}" to warehouse "${warehouse?.name}"`);
    
    alert("Rack added successfully!");
    document.getElementById("rackName").value = "";
    document.getElementById("rackDesc").value = "";
    
    loadRacksList();
    await loadInventoryTree();
}

async function loadRacksList() {
    const orgId = await getOrgId();
    const { data, error } = await supabaseClient
        .from("racks")
        .select(`
            *,
            warehouses:warehouse_id (
                name
            )
        `)
        .eq('organization_id', orgId)  // Add this
        .order("name");

    if (error) {
        console.error("Error loading racks:", error);
        return;
    }

    currentRacks = data;
    displayRacks(data);
}


function displayRacks(racks) {
    const container = document.getElementById("rackList");
    container.innerHTML = "";

    if (racks.length === 0) {
        container.innerHTML = '<p class="loading">No racks found</p>';
        return;
    }

    racks.forEach(r => {
        const div = document.createElement("div");
        div.className = "entity-item";
        div.innerHTML = `
            <div class="entity-info">
                <div class="entity-name">${r.name}</div>
                <div class="entity-details">
                    Warehouse: ${r.warehouses?.name || 'Unknown'}<br>
                    ${r.description || 'No description'}
                </div>
            </div>
            <div class="entity-actions">
                <button class="btn btn-small btn-primary" onclick="editRack('${r.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteRack('${r.id}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterRacks() {
    const searchTerm = document.getElementById("rackSearch").value.toLowerCase();
    const filtered = currentRacks.filter(r => 
        r.name.toLowerCase().includes(searchTerm) || 
        (r.description && r.description.toLowerCase().includes(searchTerm)) ||
        (r.warehouses?.name && r.warehouses.name.toLowerCase().includes(searchTerm))
    );
    displayRacks(filtered);
}

async function editRack(id) {
    const rack = currentRacks.find(r => r.id === id);
    
    // Load warehouses for dropdown
    const { data: warehouses } = await supabaseClient
        .from("warehouses")
        .select("id, name")
        .order("name");
    
    let warehouseOptions = '<option value="">Select Warehouse</option>';
    warehouses.forEach(w => {
        const selected = w.id === rack.warehouse_id ? 'selected' : '';
        warehouseOptions += `<option value="${w.id}" ${selected}>${w.name}</option>`;
    });
    
    document.getElementById("modalTitle").innerText = "Edit Rack";
    document.getElementById("modalBody").innerHTML = `
        <div class="form-group">
            <label>Warehouse</label>
            <select id="editWarehouse">${warehouseOptions}</select>
        </div>
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editName" value="${rack.name}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editDesc">${rack.description || ''}</textarea>
        </div>
        <button class="btn btn-success" onclick="updateRack('${id}')">Update</button>
    `;
    
    document.getElementById("editModal").style.display = "block";
}

async function updateRack(id) {
    const warehouse_id = document.getElementById("editWarehouse").value;
    const name = document.getElementById("editName").value;
    const description = document.getElementById("editDesc").value;

    if (!warehouse_id) {
        alert("Please select a warehouse");
        return;
    }

    if (!name) {
        alert("Please enter a name");
        return;
    }

    const { error } = await supabaseClient
        .from("racks")
        .update({ name, description, warehouse_id })
        .eq("id", id);

    if (error) {
        alert("Error updating rack: " + error.message);
        return;
    }

    await logActivity('UPDATE', 'racks', id, `Updated rack "${name}"`);
    
    alert("Rack updated successfully!");
    closeModal();
    loadRacksList();
    await loadInventoryTree();
}

async function deleteRack(id) {
    if (!confirm("Are you sure you want to delete this rack? This will also delete all shelves, boxes, and items in it!")) {
        return;
    }

    const rack = currentRacks.find(r => r.id === id);
    
    const { error } = await supabaseClient
        .from("racks")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error deleting rack: " + error.message);
        return;
    }

    await logActivity('DELETE', 'racks', id, `Deleted rack "${rack.name}"`);
    
    alert("Rack deleted successfully!");
    loadRacksList();
    await loadInventoryTree();
}

// SHELF FUNCTIONS
async function addShelf() {
    const warehouse_id = document.getElementById("shelfWarehouse").value;
    const rack_id = document.getElementById("shelfRack").value;
    const name = document.getElementById("shelfName").value;
    const description = document.getElementById("shelfDesc").value;
    const capacity = parseInt(document.getElementById("shelfCapacity").value) || null;
    const orgId = await getOrgId();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!warehouse_id || !rack_id) {
        alert("Please select warehouse and rack");
        return;
    }

    if (!name) {
        alert("Please enter a shelf name");
        return;
    }

    const { data, error } = await supabaseClient
        .from("shelves")
        .insert([{ 
            name, 
            description, 
            capacity,
            warehouse_id,
            rack_id,
            organization_id: orgId,
            created_by: user.id  // Add created_by
        }])
        .select();

    if (error) {
        alert("Error adding shelf: " + error.message);
        return;
    }

    // Get rack name for activity log
    const { data: rack } = await supabaseClient
        .from("racks")
        .select("name")
        .eq("id", rack_id)
        .single();

    await logActivity('INSERT', 'shelves', data[0].id, `Added shelf "${name}" to rack "${rack?.name}"`);
    
    alert("Shelf added successfully!");
    document.getElementById("shelfName").value = "";
    document.getElementById("shelfDesc").value = "";
    document.getElementById("shelfCapacity").value = "";
    
    loadShelvesList();
    await loadInventoryTree();
}

async function loadShelvesList() {
    const orgId = await getOrgId();
    let query = supabaseClient
        .from("shelves")
        .select(`
            *,
            racks:rack_id (
                name,
                warehouses:warehouse_id (
                    name
                )
            )
        `);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading shelves:", error);
        return;
    }

    currentShelves = data || [];
    displayShelves(data || []);
}

function displayShelves(shelves) {
    const container = document.getElementById("shelfList");
    container.innerHTML = "";

    if (shelves.length === 0) {
        container.innerHTML = '<p class="loading">No shelves found</p>';
        return;
    }

    shelves.forEach(s => {
        const div = document.createElement("div");
        div.className = "entity-item";
        div.innerHTML = `
            <div class="entity-info">
                <div class="entity-name">${s.name}</div>
                <div class="entity-details">
                    Warehouse: ${s.racks?.warehouses?.name || 'Unknown'}<br>
                    Rack: ${s.racks?.name || 'Unknown'}<br>
                    ${s.description || 'No description'}<br>
                    Capacity: ${s.capacity || 'Not set'}
                </div>
            </div>
            <div class="entity-actions">
                <button class="btn btn-small btn-primary" onclick="editShelf('${s.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteShelf('${s.id}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterShelves() {
    const searchTerm = document.getElementById("shelfSearch").value.toLowerCase();
    const filtered = currentShelves.filter(s => 
        s.name.toLowerCase().includes(searchTerm) || 
        (s.description && s.description.toLowerCase().includes(searchTerm)) ||
        (s.racks?.name && s.racks.name.toLowerCase().includes(searchTerm))
    );
    displayShelves(filtered);
}

async function editShelf(id) {
    const shelf = currentShelves.find(s => s.id === id);
    
    // Load warehouses for dropdown
    const { data: warehouses } = await supabaseClient
        .from("warehouses")
        .select("id, name")
        .order("name");
    
    // Load racks for dropdown
    const { data: racks } = await supabaseClient
        .from("racks")
        .select("id, name, warehouse_id")
        .order("name");
    
    let warehouseOptions = '<option value="">Select Warehouse</option>';
    warehouses.forEach(w => {
        const selected = w.id === shelf.warehouse_id ? 'selected' : '';
        warehouseOptions += `<option value="${w.id}" ${selected}>${w.name}</option>`;
    });
    
    let rackOptions = '<option value="">Select Rack</option>';
    racks.forEach(r => {
        if (r.warehouse_id === shelf.warehouse_id) {
            const selected = r.id === shelf.rack_id ? 'selected' : '';
            rackOptions += `<option value="${r.id}" ${selected}>${r.name}</option>`;
        }
    });
    
    document.getElementById("modalTitle").innerText = "Edit Shelf";
    document.getElementById("modalBody").innerHTML = `
        <div class="form-group">
            <label>Warehouse</label>
            <select id="editWarehouse" onchange="loadEditRacks()">${warehouseOptions}</select>
        </div>
        <div class="form-group">
            <label>Rack</label>
            <select id="editRack">${rackOptions}</select>
        </div>
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editName" value="${shelf.name}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editDesc">${shelf.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Capacity</label>
            <input type="number" id="editCapacity" value="${shelf.capacity || ''}">
        </div>
        <button class="btn btn-success" onclick="updateShelf('${id}')">Update</button>
    `;
    
    document.getElementById("editModal").style.display = "block";
}

async function loadEditRacks() {
    const warehouseId = document.getElementById("editWarehouse").value;
    if (!warehouseId) return;

    const { data } = await supabaseClient
        .from("racks")
        .select("id, name")
        .eq("warehouse_id", warehouseId)
        .order("name");

    const select = document.getElementById("editRack");
    select.innerHTML = '<option value="">Select Rack</option>';
    data.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}

async function updateShelf(id) {
    const warehouse_id = document.getElementById("editWarehouse").value;
    const rack_id = document.getElementById("editRack").value;
    const name = document.getElementById("editName").value;
    const description = document.getElementById("editDesc").value;
    const capacity = parseInt(document.getElementById("editCapacity").value) || null;

    if (!warehouse_id || !rack_id) {
        alert("Please select warehouse and rack");
        return;
    }

    if (!name) {
        alert("Please enter a name");
        return;
    }

    const { error } = await supabaseClient
        .from("shelves")
        .update({ name, description, capacity, warehouse_id, rack_id })
        .eq("id", id);

    if (error) {
        alert("Error updating shelf: " + error.message);
        return;
    }

    await logActivity('UPDATE', 'shelves', id, `Updated shelf "${name}"`);
    
    alert("Shelf updated successfully!");
    closeModal();
    loadShelvesList();
    await loadInventoryTree();
}

async function deleteShelf(id) {
    if (!confirm("Are you sure you want to delete this shelf? This will also delete all boxes and items in it!")) {
        return;
    }

    const shelf = currentShelves.find(s => s.id === id);
    
    const { error } = await supabaseClient
        .from("shelves")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error deleting shelf: " + error.message);
        return;
    }

    await logActivity('DELETE', 'shelves', id, `Deleted shelf "${shelf.name}"`);
    
    alert("Shelf deleted successfully!");
    loadShelvesList();
    await loadInventoryTree();
}

// BOX FUNCTIONS
async function addBox() {
    const warehouse_id = document.getElementById("boxWarehouse").value;
    const rack_id = document.getElementById("boxRack").value;
    const shelf_id = document.getElementById("boxShelf").value;
    const name = document.getElementById("boxName").value;
    const description = document.getElementById("boxDesc").value;
    const capacity = parseInt(document.getElementById("boxCapacity").value) || null;
    const orgId = await getOrgId();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!warehouse_id || !rack_id || !shelf_id) {
        alert("Please select warehouse, rack, and shelf");
        return;
    }

    if (!name) {
        alert("Please enter a box name");
        return;
    }

    const { data, error } = await supabaseClient
        .from("boxes")
        .insert([{ 
            name, 
            description, 
            capacity,
            warehouse_id,
            rack_id,
            shelf_id,
            organization_id: orgId,
            created_by: user.id  // Add created_by
        }])
        .select();

    if (error) {
        alert("Error adding box: " + error.message);
        return;
    }

    // Get shelf name for activity log
    const { data: shelf } = await supabaseClient
        .from("shelves")
        .select("name")
        .eq("id", shelf_id)
        .single();

    await logActivity('INSERT', 'boxes', data[0].id, `Added box "${name}" to shelf "${shelf?.name}"`);
    
    alert("Box added successfully!");
    document.getElementById("boxName").value = "";
    document.getElementById("boxDesc").value = "";
    document.getElementById("boxCapacity").value = "";
    
    loadBoxesList();
    await loadInventoryTree();
}

async function loadBoxesList() {
    const orgId = await getOrgId();
    let query = supabaseClient
        .from("boxes")
        .select(`
            *,
            shelves:shelf_id (
                name,
                racks:rack_id (
                    name,
                    warehouses:warehouse_id (
                        name
                    )
                )
            )
        `);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading boxes:", error);
        return;
    }

    currentBoxes = data || [];
    displayBoxes(data || []);
}

function displayBoxes(boxes) {
    const container = document.getElementById("boxList");
    container.innerHTML = "";

    if (boxes.length === 0) {
        container.innerHTML = '<p class="loading">No boxes found</p>';
        return;
    }

    boxes.forEach(b => {
        const div = document.createElement("div");
        div.className = "entity-item";
        div.innerHTML = `
            <div class="entity-info">
                <div class="entity-name">${b.name}</div>
                <div class="entity-details">
                    Warehouse: ${b.shelves?.racks?.warehouses?.name || 'Unknown'}<br>
                    Rack: ${b.shelves?.racks?.name || 'Unknown'}<br>
                    Shelf: ${b.shelves?.name || 'Unknown'}<br>
                    ${b.description || 'No description'}<br>
                    Capacity: ${b.capacity || 'Not set'}
                </div>
            </div>
            <div class="entity-actions">
                <button class="btn btn-small btn-primary" onclick="editBox('${b.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteBox('${b.id}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterBoxes() {
    const searchTerm = document.getElementById("boxSearch").value.toLowerCase();
    const filtered = currentBoxes.filter(b => 
        b.name.toLowerCase().includes(searchTerm) || 
        (b.description && b.description.toLowerCase().includes(searchTerm)) ||
        (b.shelves?.name && b.shelves.name.toLowerCase().includes(searchTerm))
    );
    displayBoxes(filtered);
}

async function editBox(id) {
    const box = currentBoxes.find(b => b.id === id);
    
    document.getElementById("modalTitle").innerText = "Edit Box";
    document.getElementById("modalBody").innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editName" value="${box.name}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editDesc">${box.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Capacity</label>
            <input type="number" id="editCapacity" value="${box.capacity || ''}">
        </div>
        <button class="btn btn-success" onclick="updateBox('${id}')">Update</button>
    `;
    
    document.getElementById("editModal").style.display = "block";
}

async function updateBox(id) {
    const name = document.getElementById("editName").value;
    const description = document.getElementById("editDesc").value;
    const capacity = parseInt(document.getElementById("editCapacity").value) || null;

    if (!name) {
        alert("Please enter a name");
        return;
    }

    const { error } = await supabaseClient
        .from("boxes")
        .update({ name, description, capacity })
        .eq("id", id);

    if (error) {
        alert("Error updating box: " + error.message);
        return;
    }

    await logActivity('UPDATE', 'boxes', id, `Updated box "${name}"`);
    
    alert("Box updated successfully!");
    closeModal();
    loadBoxesList();
    await loadInventoryTree();
}

async function deleteBox(id) {
    if (!confirm("Are you sure you want to delete this box? This will also delete all items in it!")) {
        return;
    }

    const box = currentBoxes.find(b => b.id === id);
    
    const { error } = await supabaseClient
        .from("boxes")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error deleting box: " + error.message);
        return;
    }

    await logActivity('DELETE', 'boxes', id, `Deleted box "${box.name}"`);
    
    alert("Box deleted successfully!");
    loadBoxesList();
    await loadInventoryTree();
}

// ITEM FUNCTIONS
async function addItem() {
    const warehouse_id = document.getElementById("itemWarehouse").value;
    const rack_id = document.getElementById("itemRack").value;
    const shelf_id = document.getElementById("itemShelf").value;
    const box_id = document.getElementById("itemBox").value || null;
    const name = document.getElementById("itemName").value;
    const quantity = parseInt(document.getElementById("itemQuantity").value);
    const value = parseFloat(document.getElementById("itemValue").value);
    const description = document.getElementById("itemDesc").value;
    const orgId = await getOrgId();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!warehouse_id || !rack_id || !shelf_id) {
        alert("Please select warehouse, rack, and shelf");
        return;
    }

    if (!name) {
        alert("Please enter an item name");
        return;
    }

    if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity");
        return;
    }

    const { data, error } = await supabaseClient
        .from("items")
        .insert([{
            name,
            quantity,
            value: value || 0,
            description,
            warehouse_id,
            rack_id,
            shelf_id,
            box_id,
            organization_id: orgId,
            created_by: user.id  // Add created_by
        }])
        .select();

    if (error) {
        alert("Error adding item: " + error.message);
        return;
    }

    await logActivity('INSERT', 'items', data[0].id, `Added item "${name}" with quantity ${quantity} to ${box_id ? 'box' : 'shelf'}`);
    
    alert("Item added successfully!");
    document.getElementById("itemName").value = "";
    document.getElementById("itemQuantity").value = "";
    document.getElementById("itemValue").value = "";
    document.getElementById("itemDesc").value = "";
    
    loadItemsList();
    loadMoveItemsDropdown();
    await loadInventoryTree();
}

async function loadItemsList() {
    const orgId = await getOrgId();
    let query = supabaseClient
        .from("items")
        .select(`
            *,
            warehouses:warehouse_id (name),
            racks:rack_id (name),
            shelves:shelf_id (name),
            boxes:box_id (name)
        `);
    
    // Add organization filter
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data, error } = await query.order("name");

    if (error) {
        console.error("Error loading items:", error);
        return;
    }

    currentItems = data || [];
    displayItems(data || []);
    
    // Refresh the move items dropdown when items list is loaded
    await loadMoveItemsDropdown();
}

function displayItems(items) {
    const container = document.getElementById("itemList");
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = '<p class="loading">No items found</p>';
        return;
    }

    items.forEach(i => {
        const location = i.boxes?.name ? 
            `Box: ${i.boxes.name}` : 
            `Shelf: ${i.shelves?.name || 'Unknown'}`;
        
        const div = document.createElement("div");
        div.className = "entity-item";
        div.innerHTML = `
            <div class="entity-info">
                <div class="entity-name">${i.name}</div>
                <div class="entity-details">
                    Warehouse: ${i.warehouses?.name || 'Unknown'}<br>
                    Rack: ${i.racks?.name || 'Unknown'}<br>
                    ${location}<br>
                    Quantity: ${i.quantity}<br>
                    Value: ₹${i.value || 0}<br>
                    ${i.description || 'No description'}
                </div>
            </div>
            <div class="entity-actions">
                <button class="btn btn-small btn-primary" onclick="editItem('${i.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteItem('${i.id}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filterItems() {
    const searchTerm = document.getElementById("itemSearch").value.toLowerCase();
    const filtered = currentItems.filter(i => 
        i.name.toLowerCase().includes(searchTerm) || 
        (i.description && i.description.toLowerCase().includes(searchTerm))
    );
    displayItems(filtered);
}

async function editItem(id) {
    const item = currentItems.find(i => i.id === id);
    
    document.getElementById("modalTitle").innerText = "Edit Item";
    document.getElementById("modalBody").innerHTML = `
        <div class="form-group">
            <label>Name</label>
            <input type="text" id="editName" value="${item.name}">
        </div>
        <div class="form-group">
            <label>Quantity</label>
            <input type="number" id="editQuantity" value="${item.quantity}">
        </div>
        <div class="form-group">
            <label>Value (₹)</label>
            <input type="number" id="editValue" value="${item.value || ''}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editDesc">${item.description || ''}</textarea>
        </div>
        <button class="btn btn-success" onclick="updateItem('${id}')">Update</button>
    `;
    
    document.getElementById("editModal").style.display = "block";
}

async function updateItem(id) {
    const name = document.getElementById("editName").value;
    const quantity = parseInt(document.getElementById("editQuantity").value);
    const value = parseFloat(document.getElementById("editValue").value);
    const description = document.getElementById("editDesc").value;

    if (!name) {
        alert("Please enter a name");
        return;
    }

    if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity");
        return;
    }

    const { error } = await supabaseClient
        .from("items")
        .update({ name, quantity, value: value || 0, description })
        .eq("id", id);

    if (error) {
        alert("Error updating item: " + error.message);
        return;
    }

    await logActivity('UPDATE', 'items', id, `Updated item "${name}"`);
    
    alert("Item updated successfully!");
    closeModal();
    loadItemsList();
    loadMoveItemsDropdown();
    await loadInventoryTree();
}

async function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) {
        return;
    }

    const item = currentItems.find(i => i.id === id);
    
    const { error } = await supabaseClient
        .from("items")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error deleting item: " + error.message);
        return;
    }

    await logActivity('DELETE', 'items', id, `Deleted item "${item.name}"`);
    
    alert("Item deleted successfully!");
    loadItemsList();
    loadMoveItemsDropdown();
    await loadInventoryTree();
}



// MOVE ITEM FUNCTIONS
// async function loadMoveItemsDropdown() {
//     try {
//         console.log("Loading move items dropdown...");
        
//         const { data, error } = await supabaseClient
//             .from("items")
//             .select("id, name, quantity, warehouse_id, rack_id, shelf_id, box_id")
//             .order("name");

//         if (error) {
//             console.error("Error loading items for move:", error);
//             return;
//         }

//         console.log(`Loaded ${data?.length || 0} items for move dropdown`);

//         const select = document.getElementById("moveItemSelect");
//         if (!select) {
//             console.error("moveItemSelect element not found");
//             return;
//         }
        
//         select.innerHTML = '<option value="">Select Item to Move</option>';
        
//         if (!data || data.length === 0) {
//             select.innerHTML += '<option value="" disabled>No items available</option>';
//             return;
//         }
        
//         data.forEach(i => {
//             const option = document.createElement('option');
//             option.value = i.id;
//             option.setAttribute('data-quantity', i.quantity);
//             option.textContent = `${i.name} (Available: ${i.quantity})`;
//             select.appendChild(option);
//         });
        
//         console.log("Move items dropdown populated successfully");
//     } catch (err) {
//         console.error("Error in loadMoveItemsDropdown:", err);
//     }
// }



// Replace the existing moveItem() function and add these helper functions

// MOVE ITEM FUNCTIONS - FIXED
async function loadMoveItemsDropdown() {
    try {
        console.log("Loading move items dropdown...");
        const orgId = await getOrgId();
        
        let query = supabaseClient
            .from("items")
            .select("id, name, quantity, warehouse_id, rack_id, shelf_id, box_id");
        
        // Add organization filter
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }
        
        const { data, error } = await query.order("name");

        if (error) {
            console.error("Error loading items for move:", error);
            return;
        }

        console.log(`Loaded ${data?.length || 0} items for move dropdown`);

        const select = document.getElementById("moveItemSelect");
        if (!select) {
            console.error("moveItemSelect element not found");
            return;
        }
        
        select.innerHTML = '<option value="">Select Item to Move</option>';
        
        if (!data || data.length === 0) {
            select.innerHTML += '<option value="" disabled>No items available</option>';
            return;
        }
        
        data.forEach(i => {
            const option = document.createElement('option');
            option.value = i.id;
            option.setAttribute('data-quantity', i.quantity);
            option.textContent = `${i.name} (Available: ${i.quantity})`;
            select.appendChild(option);
        });
        
        console.log("Move items dropdown populated successfully");
    } catch (err) {
        console.error("Error in loadMoveItemsDropdown:", err);
    }
}

// Load destination warehouses for move
async function loadDestinationWarehouses() {
    const orgId = await getOrgId();
    try {
        console.log("Loading destination warehouses...");
        
        const { data, error } = await supabaseClient
            .from("warehouses")
            .select("id, name")
            .eq('organization_id', orgId)  // Add this
            .order("name");

        // ... rest of the function
    } catch (err) {
        console.error("Error in loadDestinationWarehouses:", err);
    }
}

// Load destination racks for move
async function loadDestinationRacks() {
    const warehouseId = document.getElementById("moveWarehouse").value;
    console.log("Loading racks for warehouse:", warehouseId);
    
    if (!warehouseId) {
        document.getElementById("moveRack").innerHTML = '<option value="">Select Destination Rack</option>';
        document.getElementById("moveShelf").innerHTML = '<option value="">Select Destination Shelf</option>';
        document.getElementById("moveBox").innerHTML = '<option value="">(Optional) Select Box</option>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("racks")
            .select("id, name")
            .eq("warehouse_id", warehouseId)
            .order("name");

        if (error) {
            console.error("Error loading racks:", error);
            return;
        }

        const select = document.getElementById("moveRack");
        select.innerHTML = '<option value="">Select Destination Rack</option>';
        
        if (data && data.length > 0) {
            data.forEach(r => {
                const option = document.createElement('option');
                option.value = r.id;
                option.textContent = r.name;
                select.appendChild(option);
            });
        }
        
        // Clear dependent dropdowns
        document.getElementById("moveShelf").innerHTML = '<option value="">Select Destination Shelf</option>';
        document.getElementById("moveBox").innerHTML = '<option value="">(Optional) Select Box</option>';
    } catch (err) {
        console.error("Error in loadDestinationRacks:", err);
    }
}

// Load destination shelves for move
async function loadDestinationShelves() {
    const rackId = document.getElementById("moveRack").value;
    console.log("Loading shelves for rack:", rackId);
    
    if (!rackId) {
        document.getElementById("moveShelf").innerHTML = '<option value="">Select Destination Shelf</option>';
        document.getElementById("moveBox").innerHTML = '<option value="">(Optional) Select Box</option>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("shelves")
            .select("id, name")
            .eq("rack_id", rackId)
            .order("name");

        if (error) {
            console.error("Error loading shelves:", error);
            return;
        }

        const select = document.getElementById("moveShelf");
        select.innerHTML = '<option value="">Select Destination Shelf</option>';
        
        if (data && data.length > 0) {
            data.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                select.appendChild(option);
            });
        }
        
        // Clear box dropdown
        document.getElementById("moveBox").innerHTML = '<option value="">(Optional) Select Box</option>';
    } catch (err) {
        console.error("Error in loadDestinationShelves:", err);
    }
}

// Load destination boxes for move
async function loadDestinationBoxes() {
    const shelfId = document.getElementById("moveShelf").value;
    console.log("Loading boxes for shelf:", shelfId);
    
    if (!shelfId) {
        document.getElementById("moveBox").innerHTML = '<option value="">(Optional) Select Box</option>';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("boxes")
            .select("id, name")
            .eq("shelf_id", shelfId)
            .order("name");

        if (error) {
            console.error("Error loading boxes:", error);
            return;
        }

        const select = document.getElementById("moveBox");
        select.innerHTML = '<option value="">(Optional) Select Box</option>';
        
        if (data && data.length > 0) {
            data.forEach(b => {
                const option = document.createElement('option');
                option.value = b.id;
                option.textContent = b.name;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error in loadDestinationBoxes:", err);
    }
}


// FIXED moveItem function
async function moveItem() {
    try {
        // Get form values
        const itemId = document.getElementById("moveItemSelect").value;
        const to_warehouse_id = document.getElementById("moveWarehouse").value;
        const to_rack_id = document.getElementById("moveRack").value;
        const to_shelf_id = document.getElementById("moveShelf").value;
        const to_box_id = document.getElementById("moveBox").value || null;
        const quantityToMove = parseInt(document.getElementById("moveQuantity").value);
        const reason = document.getElementById("moveReason").value || "No reason specified";
        const orgId = await getOrgId();
        const { data: { user } } = await supabaseClient.auth.getUser();

        // Validate inputs
        if (!itemId) {
            alert("Please select an item to move");
            return;
        }

        if (!to_warehouse_id) {
            alert("Please select destination warehouse");
            return;
        }

        if (!to_rack_id) {
            alert("Please select destination rack");
            return;
        }

        if (!to_shelf_id) {
            alert("Please select destination shelf");
            return;
        }

        if (!quantityToMove || quantityToMove <= 0) {
            alert("Please enter a valid quantity to move");
            return;
        }

        // Get current item details
        const { data: item, error: itemError } = await supabaseClient
            .from("items")
            .select("*")
            .eq("id", itemId)
            .single();

        if (itemError || !item) {
            alert("Error getting item details: " + (itemError?.message || "Item not found"));
            return;
        }

        if (quantityToMove > item.quantity) {
            alert(`Cannot move ${quantityToMove} items. Only ${item.quantity} available.`);
            return;
        }

        // Perform the move operation
        if (quantityToMove === item.quantity) {
            // Move all items - update the existing record
            const { error: updateError } = await supabaseClient
                .from("items")
                .update({
                    warehouse_id: to_warehouse_id,
                    rack_id: to_rack_id,
                    shelf_id: to_shelf_id,
                    box_id: to_box_id
                })
                .eq("id", itemId);

            if (updateError) {
                throw new Error("Failed to update item location: " + updateError.message);
            }

            // Log the movement
            await logActivity(
                'MOVE',
                'items',
                itemId,
                `Moved all ${quantityToMove} of "${item.name}" to ${to_box_id ? 'box' : 'shelf'} (Reason: ${reason})`
            );

            alert(`Successfully moved all ${quantityToMove} "${item.name}" to new location!`);
        } else {
            // Move some items - reduce quantity from original and create new item
            const newQuantity = item.quantity - quantityToMove;
            
            // Update original item quantity
            const { error: updateError } = await supabaseClient
                .from("items")
                .update({ quantity: newQuantity })
                .eq("id", itemId);

            if (updateError) {
                throw new Error("Failed to update original item quantity: " + updateError.message);
            }

            // Create new item at destination with created_by
            const { data: newItem, error: insertError } = await supabaseClient
                .from("items")
                .insert([{
                    name: item.name,
                    quantity: quantityToMove,
                    value: item.value,
                    description: item.description,
                    warehouse_id: to_warehouse_id,
                    rack_id: to_rack_id,
                    shelf_id: to_shelf_id,
                    box_id: to_box_id,
                    organization_id: orgId,
                    created_by: user.id  // Add created_by for the new item
                }])
                .select();

            if (insertError) {
                // Rollback the quantity update if insert fails
                await supabaseClient
                    .from("items")
                    .update({ quantity: item.quantity })
                    .eq("id", itemId);
                    
                throw new Error("Failed to create item at destination: " + insertError.message);
            }

            // Log the movement
            await logActivity(
                'MOVE',
                'items',
                newItem[0].id,
                `Moved ${quantityToMove} of "${item.name}" to ${to_box_id ? 'box' : 'shelf'} (Reason: ${reason})`
            );

            alert(`Successfully moved ${quantityToMove} of "${item.name}" to new location!`);
        }

        // Reset form
        document.getElementById("moveItemSelect").value = "";
        document.getElementById("moveWarehouse").value = "";
        document.getElementById("moveRack").innerHTML = '<option value="">Select Rack</option>';
        document.getElementById("moveShelf").innerHTML = '<option value="">Select Shelf</option>';
        document.getElementById("moveBox").innerHTML = '<option value="">(Optional) Select Box</option>';
        document.getElementById("moveQuantity").value = "";
        document.getElementById("moveReason").value = "";
        
        // Refresh lists
        await loadItemsList();
        await loadMoveItemsDropdown();
        await loadInventoryTree();
        
    } catch (error) {
        alert("Error moving item: " + error.message);
        console.error("Move error:", error);
    }
}

// Add this to your window.onload to initialize the move dropdowns
// Add this inside your existing window.onload function:
async function initializeMoveSection() {
    await loadMoveItemsDropdown();
    await loadDestinationWarehouses();
}

// Call this in window.onload after other initializations
// initializeMoveSection();









// Modal functions
function closeModal() {
    document.getElementById("editModal").style.display = "none";
}

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
        closeModal();
    }
}