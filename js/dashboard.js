let searchMode = false;

window.onload = async () => {
    await protectPage();
    loadUser();
    loadWarehouses();
    loadStats();
    loadActivity();
    loadRecentItems();
    await loadInventoryTree();
    
    // Add click handlers to rack cards
    setupRackClickHandlers();
};


async function loadInventoryTree() {
    const tree = document.getElementById("inventoryTree");
    tree.innerHTML = "";
    
    const orgId = sessionStorage.getItem('orgId');
    if (!orgId) {
        console.error('No organization ID found');
        tree.innerHTML = '<p class="no-data">No organization found</p>';
        return;
    }

    const { data: warehouses } = await supabaseClient
        .from("warehouses")
        .select("*")
        .eq('organization_id', orgId);

    if (!warehouses || warehouses.length === 0) {
        tree.innerHTML = '<p class="no-data">No warehouses found</p>';
        return;
    }

    warehouses.forEach(w => {
        const warehouseNode = createTreeNode("🏢", w.name, "warehouse", w.id);
        tree.appendChild(warehouseNode);
    });
}



async function loadUser() {
    const { data } = await supabaseClient.auth.getUser();
    const profile = await getUserRole();
    document.getElementById("username").innerText = data.user.email;
    
    // Store organization ID in session for easy access
    if (profile) {
        // For owners, organization_id might be null, use their id
        const orgId = profile.organization_id || data.user.id;
        sessionStorage.setItem('orgId', orgId);
        sessionStorage.setItem('userRole', profile.role);
        console.log('Organization ID set:', orgId);
    } else {
        console.error('No profile found for user');
    }
}

async function loadWarehouses() {
    const orgId = sessionStorage.getItem('orgId');
    let query = supabaseClient.from("warehouses").select("*");
    
    // Only filter by orgId if it exists
    if (orgId) {
        query = query.eq('organization_id', orgId);
    }
    
    const { data } = await query.order("name");

    const select = document.getElementById("warehouseSelect");
    select.innerHTML = '<option value="">Select Warehouse</option>';

    if (data && data.length > 0) {
        data.forEach(w => {
            select.innerHTML += `<option value="${w.id}">${w.name}</option>`;
        });

        select.value = data[0].id;
        loadWarehouseData(data[0].id);
    } else {
        // Show empty state
        clearWarehouseData();
    }
}

function clearWarehouseData() {
    document.getElementById("rackCount").innerText = "0";
    document.getElementById("shelfCount").innerText = "0";
    document.getElementById("boxCount").innerText = "0";
    document.getElementById("itemCount").innerText = "0";
    document.getElementById("rackCards").innerHTML = '<p class="no-data">Select a warehouse to view racks</p>';
}

async function loadWarehouseData(id) {
    const orgId = sessionStorage.getItem('orgId');
    
    const racks = await supabaseClient
        .from("racks")
        .select("*")
        .eq("warehouse_id", id)
        .eq('organization_id', orgId);
        
    const shelves = await supabaseClient
        .from("shelves")
        .select("*")
        .eq("warehouse_id", id)
        .eq('organization_id', orgId);
        
    const boxes = await supabaseClient
        .from("boxes")
        .select("*")
        .eq("warehouse_id", id)
        .eq('organization_id', orgId);
        
    const items = await supabaseClient
        .from("items")
        .select("*")
        .eq("warehouse_id", id)
        .eq('organization_id', orgId);

    document.getElementById("rackCount").innerText = racks.data.length;
    document.getElementById("shelfCount").innerText = shelves.data.length;
    document.getElementById("boxCount").innerText = boxes.data.length;
    document.getElementById("itemCount").innerText = items.data.length;
    
    document.getElementById("totalItems").innerText = items.data.length;

    renderRackCards(racks.data);
}

function renderRackCards(racks) {
    const container = document.getElementById("rackCards");
    container.innerHTML = "";

    if (racks.length === 0) {
        container.innerHTML = '<p class="no-data">No racks found in this warehouse</p>';
        return;
    }

    racks.forEach(r => {
        const card = document.createElement("div");
        card.className = "rack-card clickable";
        card.dataset.rackId = r.id;
        card.dataset.rackName = r.name;
        card.dataset.warehouseId = r.warehouse_id;
        
        // Get item count for this rack
        getRackItemCount(r.id).then(count => {
            card.innerHTML = `
                <div class="rack-icon">🗄️</div>
                <h4>${r.name}</h4>
                <div class="rack-details">
                    <span class="rack-items">📦 ${count} items</span>
                    <span class="rack-id">ID: ${r.id.substring(0, 8)}...</span>
                </div>
            `;
        });
        
        container.appendChild(card);
    });
    
    setupRackClickHandlers();
}

async function getRackItemCount(rackId) {
    const { data } = await supabaseClient
        .from("items")
        .select("id")
        .eq("rack_id", rackId);
    return data ? data.length : 0;
}

function setupRackClickHandlers() {
    document.querySelectorAll('.rack-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const rackId = card.dataset.rackId;
            const rackName = card.dataset.rackName;
            const warehouseId = card.dataset.warehouseId;
            
            // Navigate to inventory.html with rack pre-selected
            window.location.href = `inventory.html?tab=racks&rack=${rackId}&warehouse=${warehouseId}`;
        });
    });
}

async function loadStats() {
    const orgId = sessionStorage.getItem('orgId');
    const { data } = await supabaseClient
        .from("items")
        .select("value, quantity")
        .eq('organization_id', orgId);

    let total = 0;
    let totalItems = 0;
    data.forEach(item => {
        total += (item.value || 0) * (item.quantity || 0);
        totalItems += item.quantity || 0;
    });

    document.getElementById("totalValue").innerText = `₹ ${total.toLocaleString()}`;
    
    const { data: warehouses } = await supabaseClient
        .from("warehouses")
        .select("id")
        .eq('organization_id', orgId);
        
    const totalWarehouses = warehouses?.length || 1;
    const utilization = Math.min(100, Math.round((totalItems / (totalWarehouses * 1000)) * 100));
    document.getElementById("spaceUtil").innerText = `${utilization}%`;
}


async function loadRecentItems() {
    const orgId = sessionStorage.getItem('orgId');
    const { data } = await supabaseClient
        .from("items")
        .select(`
            *,
            warehouses:warehouse_id (name)
        `)
        .eq('organization_id', orgId)
        .order("created_at", { ascending: false })
        .limit(5);

    const container = document.getElementById("recentItems");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="no-data">No recent items</p>';
        return;
    }

    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "recent-item";
        div.innerHTML = `
            <div class="recent-item-icon">📄</div>
            <div class="recent-item-info">
                <div class="recent-item-name">${item.name}</div>
                <div class="recent-item-meta">
                    <span>${item.warehouses?.name || 'Unknown'}</span>
                    <span>Qty: ${item.quantity}</span>
                </div>
            </div>
            <div class="recent-item-value">₹${item.value || 0}</div>
        `;
        container.appendChild(div);
    });
}

// UPDATED ACTIVITY FUNCTION
async function loadActivity() {
    const orgId = sessionStorage.getItem('orgId');
    const { data } = await supabaseClient
        .from("activity_logs")
        .select(`
            *,
            users:user_id (
                email
            )
        `)
        .eq('organization_id', orgId)
        .order("created_at", { ascending: false })
        .limit(20);

    const container = document.getElementById("activityList");
    container.innerHTML = "";
    document.getElementById("activityCount").innerText = data?.length || 0;

    if (!data || data.length === 0) {
        container.innerHTML = "<p class='no-activity'>No recent activity</p>";
        return;
    }

    data.forEach(a => {
        const activityItem = document.createElement("div");
        activityItem.className = "activity-item";
        
        const userEmail = a.users?.email || 'Unknown User';
        const userName = userEmail.split('@')[0];
        const activityTime = new Date(a.created_at);
        const timeAgo = getTimeAgo(activityTime);
        const { icon, color } = getActivityIcon(a.action);
        
        let actionText = a.description || `${a.action} ${a.entity_type}`;
        
        activityItem.innerHTML = `
            <div class="activity-item-header">
                <span class="activity-user">${userName}</span>
                <span class="activity-time" title="${activityTime.toLocaleString()}">${timeAgo}</span>
            </div>
            <div class="activity-item-body" style="border-left-color: ${color}">
                <span class="activity-icon">${icon}</span>
                <span class="activity-text">${actionText}</span>
            </div>
        `;
        
        container.appendChild(activityItem);
    });
}

// Helper function to get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// Helper function to get icon and color based on action
function getActivityIcon(action) {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('insert') || actionLower.includes('add')) {
        return { icon: '➕', color: '#4caf50' };
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
        return { icon: '✏️', color: '#ff9800' };
    } else if (actionLower.includes('delete')) {
        return { icon: '❌', color: '#f44336' };
    } else if (actionLower.includes('move')) {
        return { icon: '↗️', color: '#2196f3' };
    } else {
        return { icon: '•', color: '#757575' };
    }
}

// Helper function to log activities
async function logActivity(action, entityType, entityId, description) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const orgId = sessionStorage.getItem('orgId');
    
    if (!user) return;
    
    await supabaseClient
        .from("activity_logs")
        .insert([{
            user_id: user.id,
            organization_id: orgId,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            description: description,
            created_at: new Date().toISOString()
        }]);
}

// [REST OF YOUR EXISTING TREE AND SEARCH CODE REMAINS EXACTLY THE SAME]
// ... (keep all your existing tree and search functions)





async function logActivity(action, entityType, entityId, description) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const orgId = sessionStorage.getItem('orgId');
    
    if (!user) return;
    
    await supabaseClient
        .from("activity_logs")
        .insert([{
            user_id: user.id,
            organization_id: orgId,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            description: description,
            created_at: new Date().toISOString()
        }]);
}

function createTreeNode(icon, label, type, id) {
    const node = document.createElement("div");
    node.className = "tree-node";

    const header = document.createElement("div");
    header.className = "tree-header";

    // Map icon types to image paths
    const iconMap = {
        "🏢": "./src/warehouse.png",
        "🗄": "./src/rack.png",
        "📚": "./src/shelf.png",
        "📦": "./src/box.png"
    };

    const iconPath = iconMap[icon] || "./src/paper-clip.png";
    
    header.innerHTML = `
        <span class="tree-arrow"><img class ="inventory-exp-arrow" src="./src/arrow.png"></span>
        <span class="tree-icon">
            <img src="${iconPath}" alt="${type}" class="tree-icon-img">
        </span>
        <span class="tree-label">${label}</span>
    `;

    header.dataset.type = type;
    header.dataset.id = id;

    const children = document.createElement("div");
    children.className = "tree-children";

    // Use a flag to prevent multiple simultaneous loads
    let isLoading = false;
    
    header.onclick = async () => {
        // Don't do anything if we're in search mode
        if (searchMode) return;
        
        header.classList.toggle("open");
        children.classList.toggle("open");

        // Lazy load children only once
        if (!children.dataset.loaded && !isLoading) {
            isLoading = true;
            await loadChildren(children, type, id);
            children.dataset.loaded = "true";
            isLoading = false;
        }
    };

    node.appendChild(header);
    node.appendChild(children);

    return node;
}


async function loadChildren(container, type, id) {
    container.innerHTML = "";
    const orgId = sessionStorage.getItem('orgId');

    if (type === "warehouse") {
        const { data } = await supabaseClient
            .from("racks")
            .select("*")
            .eq("warehouse_id", id)
            .eq('organization_id', orgId);

        data.forEach(r => {
            container.appendChild(createTreeNode("🗄", r.name, "rack", r.id));
        });
    }

    if (type === "rack") {
        const { data } = await supabaseClient
            .from("shelves")
            .select("*")
            .eq("rack_id", id)
            .eq('organization_id', orgId);

        data.forEach(s => {
            container.appendChild(createTreeNode("📚", s.name, "shelf", s.id));
        });
    }

    if (type === "shelf") {
        const { data: boxes } = await supabaseClient
            .from("boxes")
            .select("*")
            .eq("shelf_id", id)
            .eq('organization_id', orgId);

        boxes.forEach(b => {
            container.appendChild(createTreeNode("📦", b.name, "box", b.id));
        });

        const { data: items } = await supabaseClient
            .from("items")
            .select("*")
            .eq("shelf_id", id)
            .is("box_id", null)
            .eq('organization_id', orgId);

        items.forEach(i => {
            container.appendChild(createLeafNode("📄", i.name));
        });
    }

    if (type === "box") {
        const { data } = await supabaseClient
            .from("items")
            .select("*")
            .eq("box_id", id)
            .eq('organization_id', orgId);

        data.forEach(i => {
            container.appendChild(createLeafNode("📄", i.name));
        });
    }
}



// this function reset the tree when needed
async function resetTree() {
  // Clear all loaded flags
  document.querySelectorAll(".tree-children").forEach(children => {
    children.dataset.loaded = "";
    children.innerHTML = "";
    children.classList.remove("open");
  });
  
  // Reload the tree from scratch
  await loadInventoryTree();
}






function createLeafNode(icon, label) {
    const leaf = document.createElement("div");
    leaf.className = "tree-leaf";
    
    // Use item icon for leaf nodes
    leaf.innerHTML = `
        <span class="tree-icon">
            <img src="./src/paper-clip.png" alt="item" class="tree-icon-img">
        </span>
        <span>${label}</span>
    `;
    return leaf;
}




//Search


let searchTimeout = null;
let lastSearchValue = '';

document.getElementById("searchBar").addEventListener("input", function () {
  const value = this.value.toLowerCase().trim();
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Debounce search to prevent multiple rapid executions
  searchTimeout = setTimeout(() => {
    searchTree(value);
  }, 300);
});

async function searchTree(value) {
  // Prevent searching the same value multiple times
  if (value === lastSearchValue) {
    return;
  }
  lastSearchValue = value;
  
  value = value.trim().toLowerCase();

  const allHeaders = document.querySelectorAll(".tree-header, .tree-leaf");

  // Reset highlight
  allHeaders.forEach(el => el.classList.remove("search-match"));

  if (!value) {
    searchMode = false;
    lastSearchValue = '';

    // Restore tree to normal state
    document.querySelectorAll(".tree-node")
      .forEach(n => n.style.display = "block");

    // Close all children but keep them loaded
    document.querySelectorAll(".tree-children")
      .forEach(c => c.classList.remove("open"));

    return;
  }

  searchMode = true;

  // 🔥 FIRST: Expand the entire tree to load all data (but don't load twice)
  await expandEntireTree();

  // THEN: Hide all nodes
  document.querySelectorAll(".tree-node").forEach(node => {
    node.style.display = "none";
  });

  // Get all headers and leaves that match
  const matches = [];
  allHeaders.forEach(el => {
    if (el.innerText.toLowerCase().includes(value)) {
      matches.push(el);
    }
  });

  // For each match, show its path
  for (let el of matches) {
    el.classList.add("search-match");
    
    let parent = el.closest(".tree-node");
    const pathToShow = [];
    
    // Build the path from root to this node
    while (parent) {
      pathToShow.unshift(parent);
      parent = parent.parentElement.closest(".tree-node");
    }
    
    // Show each node in the path - DON'T load children again, just show them
    for (let node of pathToShow) {
      node.style.display = "block";
      
      // Make sure children are open (they're already loaded by expandEntireTree)
      const children = node.querySelector(".tree-children");
      if (children) {
        children.classList.add("open");
      }
    }
  }
}


async function expandEntireTree() {
    const headers = document.querySelectorAll(".tree-header");
    const orgId = sessionStorage.getItem('orgId');
    
    for (let header of headers) {
        const node = header.parentElement;
        const children = node.querySelector(".tree-children");
        
        if (!children) continue;
        
        // Only load if not already loaded
        if (!children.dataset.loaded) {
            const type = header.dataset.type;
            const id = header.dataset.id;
            
            if (type && id) {
                // Clear and load with orgId filter
                children.innerHTML = '';
                await loadChildren(children, type, id);
                children.dataset.loaded = "true";
            }
        }
        
        // Always open but don't reload
        children.classList.add("open");
    }
}










