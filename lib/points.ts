export function getPlacementPoints(position: number, mode: string) {
  const m = mode === "squad" ? "team" : mode; 

  // SOLO
  if (m === "solo") {
    if (position === 1) return 500
    if (position === 2) return 400
    if (position === 3) return 300
    if (position === 4) return 200
    if (position === 5) return 100
    if (position <= 10) return 75
    if (position <= 15) return 50
    if (position <= 20) return 30
    return 0
  }

  // DUO
  if (m === "duo") {
    if (position === 1) return 500
    if (position === 2) return 400
    if (position === 3) return 300
    if (position === 4) return 200
    if (position <= 10) return 100
    if (position <= 15) return 50
    return 0
  }

  // TEAM
  if (m === "team") {
    if (position === 1) return 500
    if (position === 2) return 400
    if (position === 3) return 300
    if (position === 4) return 200
    if (position === 5) return 180
    if (position <= 10) return 75
    return 0
  }

  return 0
}

export function getKillPoints(kills: number) {
  return kills * 5
}

export function calculateMatchPoints(
  position: number,
  kills: number,
  mode: string
) {
  const placement = getPlacementPoints(position, mode)
  const killPoints = getKillPoints(kills)

  return placement + killPoints
}