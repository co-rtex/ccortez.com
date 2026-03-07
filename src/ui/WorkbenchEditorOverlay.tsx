import { useMemo, useState } from 'react';

import { WORKBENCH_DISTRICTS } from '../../content/workbenches/layout';
import { projectPointOntoCorridor } from '../workbench/placement';

import type { ExperienceRecord } from '../types/experience';
import type {
  WorkbenchAccentMaterial,
  WorkbenchAnimationStyle,
  WorkbenchArchetype,
  WorkbenchCategory,
  WorkbenchDefinition,
  WorkbenchDistrict,
  WorkbenchHeroProp,
  WorkbenchPaletteToken,
  WorkbenchPropKit,
} from '../types/workbench';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface WorkbenchEditorOverlayProps {
  definitions: WorkbenchDefinition[];
  records: WorkbenchRuntimeRecord[];
  experiences: ExperienceRecord[];
  selectedWorkbenchId: string | null;
  exportSource: string;
  onSelectWorkbench: (id: string) => void;
  onAddWorkbench: () => void;
  onDuplicateWorkbench: (id: string) => void;
  onDeleteWorkbench: (id: string) => void;
  onUpdateWorkbench: (id: string, updater: (current: WorkbenchDefinition) => WorkbenchDefinition) => void;
}

const categoryOptions: WorkbenchCategory[] = [
  'work-experience',
  'projects',
  'personal-life',
  'clubs',
  'extracurriculars',
];

const archetypeOptions: WorkbenchArchetype[] = [
  'console-desk',
  'atelier-worktable',
  'journal-console',
  'commons-table',
  'field-station',
];

const paletteOptions: WorkbenchPaletteToken[] = [
  'work-ember',
  'project-citrine',
  'personal-rose',
  'club-verde',
  'extra-cobalt',
  'draft-mist',
];

const accentOptions: WorkbenchAccentMaterial[] = [
  'brushed-metal',
  'warm-wood',
  'ceramic',
  'frosted-glass',
  'powder-coat',
];

const propKitOptions: WorkbenchPropKit[] = [
  'software-station',
  'prototype-lab',
  'reflection-nook',
  'club-circle',
  'field-kit',
];

const heroPropOptions: Array<WorkbenchHeroProp | ''> = [
  '',
  'monitor-stack',
  'signal-dish',
  'memory-orb',
  'club-banner',
  'wayfinder-arch',
];

const animationOptions: Array<WorkbenchAnimationStyle | ''> = [
  '',
  'idle-pulse',
  'soft-orbit',
  'signal-blink',
  'paper-breeze',
  'still',
];

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function WorkbenchEditorOverlay({
  definitions,
  records,
  experiences,
  selectedWorkbenchId,
  exportSource,
  onSelectWorkbench,
  onAddWorkbench,
  onDuplicateWorkbench,
  onDeleteWorkbench,
  onUpdateWorkbench,
}: WorkbenchEditorOverlayProps) {
  const [copied, setCopied] = useState(false);
  const selectedDefinition = useMemo(
    () => definitions.find((definition) => definition.id === selectedWorkbenchId),
    [definitions, selectedWorkbenchId],
  );
  const selectedRecord = useMemo(
    () => records.find((record) => record.definition.id === selectedWorkbenchId),
    [records, selectedWorkbenchId],
  );

  async function copyExport(): Promise<void> {
    await navigator.clipboard.writeText(exportSource);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function updateSelected(updater: (current: WorkbenchDefinition) => WorkbenchDefinition): void {
    if (!selectedDefinition) {
      return;
    }

    onUpdateWorkbench(selectedDefinition.id, updater);
  }

  return (
    <aside className="workbench-editor">
      <header className="workbench-editor__header">
        <div>
          <p className="workbench-editor__eyebrow">Dev Layout Editor</p>
          <h2>Workbench Layout</h2>
        </div>
        <button type="button" className="panel-close" onClick={onAddWorkbench}>
          Add Bench
        </button>
      </header>

      <section className="workbench-editor__list">
        {definitions.map((definition) => {
          const record = records.find((entry) => entry.definition.id === definition.id);
          const issueCount = record?.issues.length ?? 0;

          return (
            <button
              key={definition.id}
              type="button"
              className={`workbench-editor__list-item ${selectedWorkbenchId === definition.id ? 'workbench-editor__list-item--active' : ''}`}
              onClick={() => onSelectWorkbench(definition.id)}
            >
              <strong>{definition.title}</strong>
              <span>{formatLabel(definition.district)}</span>
              <span>{definition.visibility}</span>
              {issueCount > 0 ? <span>{issueCount} issue(s)</span> : <span>Valid</span>}
            </button>
          );
        })}
      </section>

      {selectedDefinition ? (
        <>
          <section className="workbench-editor__toolbar">
            <button type="button" className="panel-close" onClick={() => onDuplicateWorkbench(selectedDefinition.id)}>
              Duplicate
            </button>
            <button type="button" className="panel-close" onClick={() => onDeleteWorkbench(selectedDefinition.id)}>
              Delete
            </button>
            <button
              type="button"
              className="panel-close"
              onClick={() =>
                updateSelected((current) => ({
                  ...current,
                  visibility: current.visibility === 'published' ? 'draft' : 'published',
                }))
              }
            >
              {selectedDefinition.visibility === 'published' ? 'Mark Draft' : 'Publish'}
            </button>
          </section>

          <section className="workbench-editor__form">
            <label>
              <span>ID</span>
              <input value={selectedDefinition.id} readOnly />
            </label>
            <label>
              <span>Title</span>
              <input
                value={selectedDefinition.title}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={selectedDefinition.category}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    category: event.target.value as WorkbenchCategory,
                  }))
                }
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>District</span>
              <select
                value={selectedDefinition.district}
                onChange={(event) =>
                  updateSelected((current) => {
                    const nextDistrict = event.target.value as WorkbenchDistrict;
                    const nextDistrictDefinition = WORKBENCH_DISTRICTS.find(
                      (district) => district.id === nextDistrict,
                    );

                    if (current.placement.mode !== 'corridor' || !nextDistrictDefinition) {
                      return {
                        ...current,
                        district: nextDistrict,
                      };
                    }

                    return {
                      ...current,
                      district: nextDistrict,
                      placement: {
                        ...current.placement,
                        corridorId: nextDistrictDefinition.corridors.includes(current.placement.corridorId)
                          ? current.placement.corridorId
                          : nextDistrictDefinition.corridors[0] ?? current.placement.corridorId,
                      },
                    };
                  })
                }
              >
                {WORKBENCH_DISTRICTS.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Content Mode</span>
              <select
                value={selectedDefinition.contentMode}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    contentMode: event.target.value as WorkbenchDefinition['contentMode'],
                    experienceId: event.target.value === 'placeholder' ? undefined : current.experienceId,
                  }))
                }
              >
                <option value="placeholder">Placeholder</option>
                <option value="linked">Linked</option>
              </select>
            </label>
            <label>
              <span>Linked Experience</span>
              <select
                value={selectedDefinition.experienceId ?? ''}
                disabled={selectedDefinition.contentMode !== 'linked'}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    experienceId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">Unlinked</option>
                {experiences.map((experience) => (
                  <option key={experience.manifest.id} value={experience.manifest.id}>
                    {experience.manifest.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Interaction Radius</span>
              <input
                value={selectedDefinition.interactionRadius}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    interactionRadius: parseNumber(event.target.value, current.interactionRadius),
                  }))
                }
              />
            </label>
            <label>
              <span>Priority</span>
              <select
                value={selectedDefinition.priorityTier}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    priorityTier: event.target.value as WorkbenchDefinition['priorityTier'],
                  }))
                }
              >
                <option value="anchor">Anchor</option>
                <option value="standard">Standard</option>
                <option value="satellite">Satellite</option>
              </select>
            </label>
            <label className="workbench-editor__textarea">
              <span>Draft Notes</span>
              <textarea
                value={selectedDefinition.draftNotes ?? ''}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    draftNotes: event.target.value || undefined,
                  }))
                }
              />
            </label>
          </section>

          <section className="workbench-editor__subgrid">
            <label>
              <span>Placement Mode</span>
              <select
                value={selectedDefinition.placement.mode}
                onChange={(event) =>
                  updateSelected((current) => {
                    if (event.target.value === current.placement.mode) {
                      return current;
                    }

                    if (event.target.value === 'freeform') {
                      const record = selectedRecord;
                      return record
                        ? {
                            ...current,
                            placement: {
                              mode: 'freeform',
                              x: record.placement.anchor.x,
                              z: record.placement.anchor.z,
                              rotationY: record.placement.rotationY,
                              yOffset: current.placement.yOffset,
                            },
                          }
                        : current;
                    }

                    const district = WORKBENCH_DISTRICTS.find((entry) => entry.id === current.district);
                    const corridorId = district?.corridors[0] ?? 'east-promenade';
                    const record = selectedRecord;
                    const projected = projectPointOntoCorridor(
                      corridorId,
                      record?.placement.anchor.x ?? 0,
                      record?.placement.anchor.z ?? 0,
                    );
                    return {
                      ...current,
                      placement: {
                        mode: 'corridor',
                        corridorId,
                        distanceAlong: projected.distanceAlong,
                        lateralOffset: projected.lateralOffset,
                        yawMode: 'follow-road',
                        yawOffset: 0,
                        yOffset: current.placement.yOffset,
                      },
                    };
                  })
                }
              >
                <option value="corridor">Corridor</option>
                <option value="freeform">Freeform</option>
              </select>
            </label>

            {selectedDefinition.placement.mode === 'corridor' ? (
              <>
                <label>
                  <span>Corridor</span>
                  <select
                    value={selectedDefinition.placement.corridorId}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'corridor'
                            ? {
                                ...current.placement,
                                corridorId: event.target.value as WorkbenchDefinition['placement'] extends { mode: 'corridor'; corridorId: infer T } ? T : never,
                              }
                            : current.placement,
                      }))
                    }
                  >
                    {WORKBENCH_DISTRICTS.flatMap((district) => district.corridors).filter((value, index, list) => list.indexOf(value) === index).map((corridorId) => (
                      <option key={corridorId} value={corridorId}>
                        {formatLabel(corridorId)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Distance Along</span>
                  <input
                    value={selectedDefinition.placement.distanceAlong}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'corridor'
                            ? {
                                ...current.placement,
                                distanceAlong: parseNumber(event.target.value, current.placement.distanceAlong),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Lateral Offset</span>
                  <input
                    value={selectedDefinition.placement.lateralOffset}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'corridor'
                            ? {
                                ...current.placement,
                                lateralOffset: parseNumber(event.target.value, current.placement.lateralOffset),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Yaw Mode</span>
                  <select
                    value={selectedDefinition.placement.yawMode}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'corridor'
                            ? {
                                ...current.placement,
                                yawMode: event.target.value as WorkbenchDefinition['placement'] extends { mode: 'corridor'; yawMode: infer T } ? T : never,
                              }
                            : current.placement,
                      }))
                    }
                  >
                    <option value="follow-road">Follow Road</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </label>
                <label>
                  <span>Yaw Offset</span>
                  <input
                    value={selectedDefinition.placement.yawOffset}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'corridor'
                            ? {
                                ...current.placement,
                                yawOffset: parseNumber(event.target.value, current.placement.yawOffset),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Y Offset</span>
                  <input
                    value={selectedDefinition.placement.yOffset}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'corridor'
                            ? {
                                ...current.placement,
                                yOffset: parseNumber(event.target.value, current.placement.yOffset),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  <span>X</span>
                  <input
                    value={selectedDefinition.placement.x}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'freeform'
                            ? {
                                ...current.placement,
                                x: parseNumber(event.target.value, current.placement.x),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Z</span>
                  <input
                    value={selectedDefinition.placement.z}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'freeform'
                            ? {
                                ...current.placement,
                                z: parseNumber(event.target.value, current.placement.z),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Rotation Y</span>
                  <input
                    value={selectedDefinition.placement.rotationY}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'freeform'
                            ? {
                                ...current.placement,
                                rotationY: parseNumber(event.target.value, current.placement.rotationY),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Y Offset</span>
                  <input
                    value={selectedDefinition.placement.yOffset}
                    onChange={(event) =>
                      updateSelected((current) => ({
                        ...current,
                        placement:
                          current.placement.mode === 'freeform'
                            ? {
                                ...current.placement,
                                yOffset: parseNumber(event.target.value, current.placement.yOffset),
                              }
                            : current.placement,
                      }))
                    }
                  />
                </label>
              </>
            )}
          </section>

          <section className="workbench-editor__subgrid">
            <label>
              <span>Archetype</span>
              <select
                value={selectedDefinition.visualRecipe.archetype}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    visualRecipe: {
                      ...current.visualRecipe,
                      archetype: event.target.value as WorkbenchArchetype,
                    },
                  }))
                }
              >
                {archetypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Palette</span>
              <select
                value={selectedDefinition.visualRecipe.palette}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    visualRecipe: {
                      ...current.visualRecipe,
                      palette: event.target.value as WorkbenchPaletteToken,
                    },
                  }))
                }
              >
                {paletteOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Accent</span>
              <select
                value={selectedDefinition.visualRecipe.accentMaterial}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    visualRecipe: {
                      ...current.visualRecipe,
                      accentMaterial: event.target.value as WorkbenchAccentMaterial,
                    },
                  }))
                }
              >
                {accentOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Prop Kit</span>
              <select
                value={selectedDefinition.visualRecipe.propKit}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    visualRecipe: {
                      ...current.visualRecipe,
                      propKit: event.target.value as WorkbenchPropKit,
                    },
                  }))
                }
              >
                {propKitOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Hero Prop</span>
              <select
                value={selectedDefinition.visualRecipe.heroProp ?? ''}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    visualRecipe: {
                      ...current.visualRecipe,
                      heroProp: (event.target.value || undefined) as WorkbenchHeroProp | undefined,
                    },
                  }))
                }
              >
                {heroPropOptions.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option ? formatLabel(option) : 'None'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Animation</span>
              <select
                value={selectedDefinition.visualRecipe.animationStyle ?? ''}
                onChange={(event) =>
                  updateSelected((current) => ({
                    ...current,
                    visualRecipe: {
                      ...current.visualRecipe,
                      animationStyle: (event.target.value || undefined) as WorkbenchAnimationStyle | undefined,
                    },
                  }))
                }
              >
                {animationOptions.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option ? formatLabel(option) : 'None'}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="workbench-editor__issues">
            <h3>Validity</h3>
            {selectedRecord?.issues.length ? (
              <ul>
                {selectedRecord.issues.map((issue) => (
                  <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            ) : (
              <p>No layout issues detected for the selected bench.</p>
            )}
          </section>
        </>
      ) : null}

      <section className="workbench-editor__export">
        <div className="workbench-editor__export-header">
          <h3>Export Layout</h3>
          <button type="button" className="panel-close" onClick={() => void copyExport()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <textarea readOnly value={exportSource} />
      </section>
    </aside>
  );
}
