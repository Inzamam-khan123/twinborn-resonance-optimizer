import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const partResonance = {
  E: 1000, R4: 850, R3: 700, R2: 550, R1: 400, R: 300,
  Y3: 200, Y2: 150, Y1: 100, Y: 50
};

const chipMultipliers = {
  0: 1.0, 1: 1.2, 2: 1.4, 4: 1.6, 6: 1.8, 9: 2.0,
  12: 2.2, 16: 2.4, 20: 2.6, 25: 2.8, 30: 3.0
};

const partKeys = Object.keys(partResonance);

function calculateCombos(partCounts, chipLimit, goals, optimizeForMax) {
  const validCombos = [];

  function generateCombos(available, current = []) {
    if (current.length === 3) {
      let baseRes = current.reduce((sum, p) => sum + partResonance[p], 0);
      for (const [chipCost, multiplier] of Object.entries(chipMultipliers)) {
        let totalRes = baseRes * multiplier;
        validCombos.push({ parts: [...current], chipCost: parseInt(chipCost), multiplier, totalRes });
      }
      return;
    }
    for (const part of partKeys) {
      if (available[part] > 0) {
        available[part]--;
        current.push(part);
        generateCombos(available, current);
        current.pop();
        available[part]++;
      }
    }
  }

  function tryCombos() {
    validCombos.length = 0;
    generateCombos({ ...partCounts });
    validCombos.sort((a, b) => b.totalRes - a.totalRes);

    let selected = [];
    let usedChips = 0;
    let usedParts = {};

    function isWithinRange(value, min, max) {
      return value >= min && value <= max;
    }

    for (let goalIndex = 0; goalIndex < goals.length; goalIndex++) {
      const [minGoal, maxGoal] = goals[goalIndex];
      let bestCombo = null;

      for (let combo of validCombos) {
        if (!isWithinRange(combo.totalRes, minGoal, maxGoal)) continue;

        let isValid = true;
        let tempUsed = { ...usedParts };
        for (let part of combo.parts) {
          tempUsed[part] = (tempUsed[part] || 0) + 1;
          if (tempUsed[part] > partCounts[part]) isValid = false;
        }

        if (isValid && usedChips + combo.chipCost <= chipLimit) {
          if (!bestCombo || (optimizeForMax && combo.totalRes > bestCombo.totalRes)) {
            bestCombo = combo;
          }
        }
      }

      if (bestCombo) {
        selected.push(bestCombo);
        usedChips += bestCombo.chipCost;
        for (let part of bestCombo.parts) {
          usedParts[part] = (usedParts[part] || 0) + 1;
        }
      }
    }

    return selected;
  }

  return tryCombos();
}

export default function TwinbornResonanceOptimizer() {
  const [partCounts, setPartCounts] = useState({});
  const [chipLimit, setChipLimit] = useState(23);
  const [goals, setGoals] = useState([
    [3000, 6000],
    [3000, 6000],
    [3000, 6000]
  ]);
  const [results, setResults] = useState([]);
  const [optimizeForMax, setOptimizeForMax] = useState(false);

  const handleCountChange = (key, value) => {
    setPartCounts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  const handleGoalChange = (index, bound, value) => {
    const newGoals = [...goals];
    newGoals[index][bound === 'min' ? 0 : 1] = parseInt(value) || 0;
    setGoals(newGoals);
  };

  const handleCalculate = () => {
    const result = calculateCombos(partCounts, chipLimit, goals, optimizeForMax);
    setResults(result);
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-xl font-bold">Twinborn Resonance Optimizer</h2>
          <div className="grid grid-cols-2 gap-2">
            {partKeys.map(key => (
              <Input key={key} type="number" placeholder={key} onChange={e => handleCountChange(key, e.target.value)} />
            ))}
          </div>
          <Input type="number" placeholder="Total Chips (e.g. 23)" onChange={e => setChipLimit(parseInt(e.target.value) || 0)} />

          <div className="space-y-1">
            <h3 className="font-semibold">Resonance Range per TB</h3>
            {goals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <Input type="number" value={goal[0]} onChange={e => handleGoalChange(i, 'min', e.target.value)} placeholder={`Min TB${i+1}`} />
                <Input type="number" value={goal[1]} onChange={e => handleGoalChange(i, 'max', e.target.value)} placeholder={`Max TB${i+1}`} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={optimizeForMax} onCheckedChange={setOptimizeForMax} />
            <span>{optimizeForMax ? 'Maximize Resonance' : 'Optimize for Chip Efficiency'}</span>
          </div>

          <Button onClick={handleCalculate}>Calculate Best Build</Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-xl font-bold">Results</h2>
            {results.map((res, i) => (
              <div key={i} className="border p-2 rounded">
                <p><strong>TB {i + 1}</strong></p>
                <p>Parts: {res.parts.join(', ')}</p>
                <p>Multiplier: {res.multiplier}×</p>
                <p>Chip Cost: {res.chipCost}</p>
                <p>Total Resonance: {res.totalRes}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}