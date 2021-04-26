
const navigationMenu = [
  {
    name: "Data Centers",
    path: "/dataCenters",
  },
  {
    name: "Permission Groups",
    path: "/permissionGroups",
  },
  {
    name: "Business Entities",
    path: "/businessEntities",
  },
  {
    name: "Products",
    path: "/products",
  },
  {
    name: "Environments",
    path: "/environments",
  },
  {
    name: "Tasks",
    path: "/tasks",
  },
];

if (window.k2api &&  window.k2api.setNavigationMenu) {
  window.k2api.setNavigationMenu(navigationMenu);
}
