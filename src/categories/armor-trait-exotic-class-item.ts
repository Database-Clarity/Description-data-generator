import { InventoryItem } from '@icemourne/tool-box'
import { Category, Item } from '../v2/types.js'

// Notification styles distinguish these perks from other intrinsics without
// depending on localized names or notification text. Derive the signature from
// both initial perk sockets; neither column has a distinct signature today.
const signature = (item: InventoryItem) => item.plug && JSON.stringify([
  item.plug.plugCategoryHash,
  (item.tooltipNotifications ?? []).map(notification => notification.displayStyle),
])

export default {
  id: 'armor-trait-exotic-class-item', label: 'Exotic Class Item Perks', group: 'Armor', order: 11,
  select(manifest) {
    const owners = Object.values(manifest.inventoryItem).filter(item =>
      !item.redacted && item.itemType === 2 && item.itemSubType === 30 && item.inventory.tierType === 6)
      .sort((a, b) => a.hash - b.hash)
    const seeds = owners.flatMap(owner => [10, 11].map(index => {
      const hash = owner.sockets?.socketEntries[index]?.singleInitialItemHash
      const plug = hash ? manifest.inventoryItem[hash] : undefined
      if (!plug || plug.redacted || !signature(plug)) throw new Error(`Missing class item initial perk ${owner.hash}/${index}`)
      return { column: index, signature: signature(plug) }
    }))
    const signatures = new Set(seeds.map(seed => seed.signature))
    return Object.values(manifest.inventoryItem).filter(plug =>
      !plug.redacted && signatures.has(signature(plug)) && Boolean(plug.plug))
      .sort((a, b) => a.hash - b.hash).map(plug => {
        const holders = owners.filter(owner => ![0, 1, 2].includes(plug.classType) || owner.classType === plug.classType)
        const columns = [...new Set(seeds.filter(seed => seed.signature === signature(plug)).map(seed => seed.column))]
        return {
          hash: plug.hash, name: plug.displayProperties.name, icon: plug.displayProperties.icon,
          categoryId: 'armor-trait-exotic-class-item', definitionType: 'DestinyInventoryItemDefinition',
          inGameDescription: plug.displayProperties.description,
          owners: holders.map(owner => owner.hash),
          ownerNames: Object.fromEntries(holders.map(owner => [owner.hash, owner.displayProperties.name])),
          ownerClasses: Object.fromEntries(holders.map(owner => [owner.hash, owner.classType])),
          perkColumn: columns.length === 1 ? columns[0] - 9 : 'unknown',
        } satisfies Item
      })
  },
} satisfies Category
