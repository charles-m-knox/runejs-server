import { DropTable, NpcServerConfig } from '@engine/config';
import * as fs from 'fs/promises';
import path from 'path';
import { NpcDefinition } from './get-2006scape-npc-defs';

export interface Drop {
    id: number;
    name: string;
    members: boolean;
    quantity: string;
    noted: boolean;
    rarity: number;
    rolls: number;
}

export interface Monster {
    id: number;
    name: string;
    last_updated: string;
    incomplete: boolean;
    members: boolean;
    release_date: string;
    combat_level: number;
    size: number;
    hitpoints: number;
    max_hit: number;
    attack_type: string[];
    attack_speed: number;
    aggressive: boolean;
    poisonous: boolean;
    venomous: boolean;
    immune_poison: boolean;
    immune_venom: boolean;
    attributes: any[];
    category: string[];
    slayer_monster: boolean;
    slayer_level: number;
    slayer_xp: number;
    slayer_masters: string[];
    duplicate: boolean;
    examine: string;
    wiki_name: string;
    wiki_url: string;
    attack_level: number;
    strength_level: number;
    defence_level: number;
    magic_level: number;
    ranged_level: number;
    attack_bonus: number;
    strength_bonus: number;
    attack_magic: number;
    magic_bonus: number;
    attack_ranged: number;
    ranged_bonus: number;
    defence_stab: number;
    defence_slash: number;
    defence_crush: number;
    defence_magic: number;
    defence_ranged: number;
    drops: Drop[];
}

/**
 * https://github.com/0xNeffarion/osrsreboxed-db/blob/master/docs/monsters-complete.json
 */
export const getMonsters = async (): Promise<Monster[]> => {
    try {
        const d = await fs.readFile(path.join('cache','datasets','monsters-complete.json'));
        const r = JSON.parse(d.toString()) as Record<string, Monster>;
        const results: Monster[] = [];
        const keys = Object.keys(r);
        for (let i = 0; i < keys.length; i++) {
            results.push(r[keys[i]]);
        }
        console.log(`read ${results.length} monster definitions`);
        return Promise.resolve(results);
    } catch (e) {
        console.error(e);
        return Promise.resolve([]);
    }
}

export const compare = (npc: NpcDefinition, monster: Monster): number => {
    let score = 0;

    // we only care about the details for attackable npc's
    if (!npc.attackable) {
        return 0;
    }

    // Compare name (highest weight)
    if (npc.name.toLowerCase() === monster.name.toLowerCase()) {
        score += 100;
    } else {
        return 0;
    }

    if (npc.examine === monster.examine) {
        score += 100;
    } else {
        return 0;
    }

    if (npc.combat === monster.combat_level) {
        score += 100;
    } else {
        return 0;
    }

    if (npc.hitpoints === monster.hitpoints) {
        score += 30;
    }

    if (npc.maxHit === monster.max_hit) {
        score += 30;
    }

    if (npc.attackSpeed >= 1000 && npc.attackSpeed / 1000 === monster.attack_speed) {
        score += 30;
    }

    if (npc.attackSpeed === 0 && monster.attack_speed === 0) {
        score += 30
    }

    if (npc.poisonous === monster.poisonous) {
        score += 20;
    }

    if (npc.attackBonus === monster.attack_bonus) {
        score += 20;
    }

    if (npc.defenceRange === monster.defence_ranged) {
        score += 20;
    }

    if (npc.defenceMage === monster.defence_magic) {
        score += 20;
    }

    // can't make an accurate estimate because defenceMelee is too broad
    // if (npc.defenceMelee === monster.defence_level) {
    //     score += 20;
    // }

    if (npc.aggressive === monster.aggressive) {
        score += 20;
    }

    if (npc.size === monster.size) {
        score += 20;
    }

    return score;
}

export interface MatchResult {
    match?: Monster;
    score: number;
}

export const findBestMatch = (npc: NpcDefinition, monsters: Monster[]): MatchResult => {
    const result: MatchResult = {
        score: 0,
    };

    for (let i = 0; i < monsters.length; i++) {
        const monster = monsters[i];
        const score = compare(npc, monster);
        if (score > result.score) {
            result.score = score;
            result.match = monster;
        }
    }

    return result;
}

export const getDropTable = (monster: Monster): DropTable[] => {
    const dt: DropTable[] = [];

    for (let i = 0; i < monster.drops.length; i++) {
        const transformed: DropTable = {
            frequency: monster.drops[i].rarity,
            itemKey: monster.drops[i].id,
            amount: parseInt(monster.drops[i].quantity),
            rolls: monster.drops[i].rolls,
            noted: monster.drops[i].noted,
        }

        dt.push(transformed);
    }

    return dt;
}

export const getAllNpcData = (npcs: NpcDefinition[], monsters: Monster[]): Record<string, NpcServerConfig> => {
    const results: Record<string, NpcServerConfig> = {};
    for (let i = 0; i < npcs.length; i++) {
        const best = findBestMatch(npcs[i], monsters);
        if (best.score > 0 && best.match) {
            const npc = npcs[i];
            const monster = best.match;
            const key = `autogen:${npc.id}`;
            results[key] = {
                game_id: npc.id,
                defensive_stats: {
                    magic: monster.defence_magic,
                    ranged: monster.defence_ranged,
                    crush: monster.defence_crush,
                    stab: monster.defence_stab,
                    slash: monster.defence_slash,
                },
                offensive_stats: {
                    speed: monster.attack_speed,
                    attack: monster.attack_level,
                    strength: monster.strength_level,
                    magic: monster.magic_level,
                    ranged: monster.ranged_level,
                    magic_strength: monster.magic_bonus, // TODO: is this being used correctly?
                    ranged_strength: monster.ranged_bonus, // TODO: is this being used correctly?
                },
                animations: {
                    attack: npc.attackAnim,
                    death: npc.deathAnim,
                    defend: npc.defenceAnim,
                },
                skills: {
                    'hitpoints': npc.hitpoints,
                },
                killable: npc.attackable,
                respawn_time: npc.respawn,
                drop_table: getDropTable(monster),
                metadata: {
                    '_monsterLookupScore': best.score,
                    name: monster.name,
                    lastUpdated: monster.last_updated,
                    releaseDate: monster.release_date,
                    combatLevel: monster.combat_level,
                    size: monster.size,
                    aggressive: monster.aggressive,
                    poisonous: monster.poisonous,
                    venomous: monster.venomous,
                    immunePoison: monster.immune_poison,
                    immuneVenom: monster.immune_venom,
                    slayerMonster: monster.slayer_monster,
                    slayerLevel: monster.slayer_level,
                    slayerXp: monster.slayer_xp,
                    slayerMasters: monster.slayer_masters,
                    examine: monster.examine,
                    wikiName: monster.wiki_name,
                    wikiUrl: monster.wiki_url,
                },
                // TODO: there are many other properties that could be added,
                // such as poisonous, venomous, immune to poison, etc
            }
        }
    }

    return results;
}
