// Archery clubs on the island of Ireland, for the club picker in Profile.
// Compiled Nov 2026 from public sources (competition results, club and university pages, county sports
// partnerships, local news). archery.ie's own club list could not be read automatically, so this is not
// complete: "Other" lets anyone type their club. To add a club, add a line: [name, county, province].
export const CLUBS = [
  // Leinster
  ['Ashbourne Archers', 'Meath', 'Leinster'],
  ['Athboy Archery Club', 'Meath', 'Leinster'],
  ['Blackheath Archers', '', 'Leinster'],
  ['CúChulainn Archers', 'Louth', 'Leinster'],
  ['DCU Archery Club', 'Dublin', 'Leinster'],
  ['Drewstown Archers', 'Meath', 'Leinster'],
  ['Dublin Archers', 'Dublin', 'Leinster'],
  ['Dublin University Archery Club (Trinity)', 'Dublin', 'Leinster'],
  ['Dun Laoghaire Archery Club', 'Dublin', 'Leinster'],
  ['Dundrum Archers', 'Dublin', 'Leinster'],
  ['Enniscorthy Archery Club', 'Wexford', 'Leinster'],
  ['Greenhills Archers', 'Dublin', 'Leinster'],
  ['Harbour House Archery Club', 'Kildare', 'Leinster'],
  ['Laois Archery', 'Laois', 'Leinster'],
  ['Liffey Archers', '', 'Leinster'],
  ['Maynooth Archery Club', 'Kildare', 'Leinster'],
  ['RCSI Archery Club', 'Dublin', 'Leinster'],
  ['SETU Carlow Archery Club', 'Carlow', 'Leinster'],
  ['TU Dublin Archery Club', 'Dublin', 'Leinster'],
  ['UCD Archery Club', 'Dublin', 'Leinster'],
  ['Wicklow Archers', 'Wicklow', 'Leinster'],
  ['Woodbrook Garden County Archers', '', 'Leinster'],
  // Munster
  ['Archers of Ennis', 'Clare', 'Munster'],
  ['Archers of Limerick', 'Limerick', 'Munster'],
  ['Black Castle Archers', '', 'Munster'],
  ['Cork City Archery Club', 'Cork', 'Munster'],
  ['Na Laoch Dall Archery Club', 'Waterford', 'Munster'],
  ['UCC Archery Club', 'Cork', 'Munster'],
  ['UL Archery Club', 'Limerick', 'Munster'],
  // Connacht
  ['ATU Galway Archery Club', 'Galway', 'Connacht'],
  ['Athenry Archers Club', 'Galway', 'Connacht'],
  ['Mayo Archery Club', 'Mayo', 'Connacht'],
  ['University of Galway Archery Club', 'Galway', 'Connacht'],
  // Ulster
  ['Ballyvally Archery Club', 'Down', 'Ulster'],
  ['City of Belfast Archers', 'Antrim', 'Ulster'],
  ['Foyle Valley Archery Club', 'Derry', 'Ulster'],
  ['Kilmore Archery Club', 'Armagh', 'Ulster'],
  ['Killygarry Archers', 'Cavan', 'Ulster'],
  ['Ulster Archers', '', 'Ulster'],
  ['Ulster University Archery Club', '', 'Ulster'],
];
export const PROVINCES = ['Leinster', 'Munster', 'Connacht', 'Ulster'];
export const isListed = name => CLUBS.some(c => c[0].toLowerCase() === (name || '').trim().toLowerCase());
