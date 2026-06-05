import React from 'react';
import { Milestone } from '../../types';
import { Check, Target } from 'lucide-react';

interface MilestonePanelProps {
  milestones: Milestone[];
  bountyRaised?: number;
  bountyGoal?: number;
}

export const MilestonePanel: React.FC<MilestonePanelProps> = ({
  milestones,
  bountyRaised = 0,
}) => {
  if (!milestones || milestones.length === 0) return null;

  // Calculate how much has been funded through milestones
  let runningTotal = 0;

  return (
    <div className="milestone-panel">
      <div className="milestone-panel-title">
        <Target size={15} />
        Milestone Progress ({milestones.filter(m => m.completed).length}/{milestones.length} Complete)
      </div>

      {milestones.map((milestone, idx) => {
        const milestoneStart = runningTotal;
        runningTotal += milestone.targetAmount;
        const isCompleted = milestone.completed;
        const isFunded = bountyRaised >= runningTotal;
        const isActive = !isCompleted && bountyRaised >= milestoneStart;
        const status = isCompleted ? 'completed' : isActive ? 'active' : 'pending';

        return (
          <div key={milestone.id} className="milestone-item">
            <div className={`milestone-marker ${status}`}>
              {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
            </div>
            <div className="milestone-info">
              <div className="milestone-title">{milestone.title}</div>
              {milestone.description && (
                <div className="milestone-desc">{milestone.description}</div>
              )}
              <div className="milestone-amount">
                R{milestone.targetAmount.toLocaleString()}
                {isFunded && !isCompleted && (
                  <span style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>
                    • Funded ✓
                  </span>
                )}
                {isCompleted && (
                  <span style={{ color: 'var(--accent-success)', marginLeft: '6px' }}>
                    • Completed ✓
                  </span>
                )}
              </div>
              {milestone.proofUrl && (
                <div style={{ marginTop: '6px' }}>
                  <img
                    src={milestone.proofUrl}
                    alt={`Proof for ${milestone.title}`}
                    style={{
                      width: '100%',
                      maxHeight: '100px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
