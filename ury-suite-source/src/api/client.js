// URY Live API Client for Frappe/ERPNext Backend

const BASE_URL = 'http://194.60.87.92:8090/api/method';
const AUTH_HEADER = 'token 3c56bb94dbd5530:d945c68a5cb4e27';

export async function callUryApi(endpoint, params = {}, options = {}) {
  try {
    const url = `${BASE_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER,
        ...options.headers
      },
      body: (options.method === 'GET' ? undefined : JSON.stringify(params))
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.message || data };
    } else {
      if (!options.silent) {
        console.warn(`[URY API] ${endpoint} returned status ${response.status}`);
      }
    }
  } catch (err) {
    if (!options.silent) {
      console.warn(`[URY API Client] ${endpoint} fetch error:`, err);
    }
  }
  return { success: false, fallback: true };
}

export const cleanTableStr = (str) => {
  if (!str) return '';
  let s = String(str).trim().toLowerCase();
  if (s.includes(' - ')) s = s.split(' - ')[0].trim();
  s = s.replace(/table/gi, '')
       .replace(/tbl/gi, '')
       .replace(/glb/gi, '')
       .replace(/[^a-z0-9]/gi, '')
       .replace(/^t/i, '')
       .replace(/^0+/, '');
  return s.trim();
};

export const isSameTable = (a, b) => {
  if (!a || !b) return false;
  const cleanA = cleanTableStr(a);
  const cleanB = cleanTableStr(b);
  if (!cleanA || !cleanB) return false;
  return cleanA === cleanB;
};

export async function fetchTableItemsFromBackend(tableName, menuItems = []) {
  if (!tableName) return [];

  const itemMap = {};

  const addParsedItem = (itemName, qty, itemNotes = '', price = 0) => {
    if (!itemName) return;
    const matchedMenu = (Array.isArray(menuItems) ? menuItems : []).find(m =>
      (m.item_name || '').toLowerCase() === (itemName || '').toLowerCase() ||
      (m.item_code || '').toLowerCase() === (itemName || '').toLowerCase()
    );

    const code = matchedMenu ? matchedMenu.item_code : itemName;
    const name = matchedMenu ? matchedMenu.item_name : itemName;
    const itemPrice = matchedMenu ? matchedMenu.price : (Number(price) || 450);
    const image = matchedMenu ? matchedMenu.image : null;

    if (itemMap[code]) {
      itemMap[code].qty += Number(qty || 1);
    } else {
      itemMap[code] = {
        item_code: code,
        item_name: name,
        price: Number(itemPrice || 0),
        qty: Number(qty || 1),
        image: image,
        notes: itemNotes || ''
      };
    }
  };

  try {
    // 1. Fetch active POS Invoices for this table directly from Frappe backend
    const posListRes = await callUryApi('frappe.client.get_list', {
      doctype: 'POS Invoice',
      fields: ['name', 'restaurant_table', 'order_type', 'grand_total', 'status', 'creation'],
      filters: {
        status: ['!=', 'Paid']
      },
      order_by: 'creation desc',
      limit_page_length: 30
    }, { silent: true });

    if (posListRes?.success && Array.isArray(posListRes.data)) {
      const matchingInvoices = posListRes.data.filter(inv => {
        if (!inv) return false;
        return isSameTable(inv.restaurant_table, tableName) || isSameTable(inv.order_type, tableName);
      });

      // ONLY fetch items for the MOST RECENT active invoice of the current table session!
      if (matchingInvoices.length > 0 && matchingInvoices[0].name) {
        const latestInvoice = matchingInvoices[0];
        const docRes = await callUryApi('frappe.client.get', {
          doctype: 'POS Invoice',
          name: latestInvoice.name
        }, { silent: true });

        if (docRes?.success && docRes.data && Array.isArray(docRes.data.items) && docRes.data.items.length > 0) {
          docRes.data.items.forEach(childItem => {
            addParsedItem(
              childItem.item_name || childItem.item_code,
              childItem.qty,
              childItem.description || childItem.notes || '',
              childItem.rate || childItem.amount
            );
          });
        }
      }
    }

    // 2. Fetch active URY KOT tickets for this table directly from Frappe backend
    if (Object.keys(itemMap).length === 0) {
      const kotListRes = await callUryApi('frappe.client.get_list', {
        doctype: 'URY KOT',
        fields: ['name', 'restaurant_table', 'invoice', 'order_status'],
        order_by: 'creation desc',
        limit_page_length: 30
      }, { silent: true });

      if (kotListRes?.success && Array.isArray(kotListRes.data)) {
        const matchingKots = kotListRes.data.filter(kot => {
          if (!kot) return false;
          const s = (kot.order_status || '').toLowerCase();
          if (['completed', 'paid', 'cancelled', 'canceled'].includes(s)) return false;
          return isSameTable(kot.restaurant_table, tableName) || (kot.invoice && isSameTable(kot.invoice, tableName));
        });

        for (const kot of matchingKots) {
          if (kot.name) {
            const kotDocRes = await callUryApi('frappe.client.get', {
              doctype: 'URY KOT',
              name: kot.name
            }, { silent: true });

            const childItems = kotDocRes?.data?.kot_items || kotDocRes?.data?.items || [];
            if (Array.isArray(childItems) && childItems.length > 0) {
              childItems.forEach(childItem => {
                addParsedItem(
                  childItem.item_name || childItem.name || childItem.item_code,
                  childItem.quantity || childItem.qty || 1,
                  childItem.notes || childItem.comments || ''
                );
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Live Backend Table Items Fetch Error]:', e);
  }

  return Object.values(itemMap);
}
