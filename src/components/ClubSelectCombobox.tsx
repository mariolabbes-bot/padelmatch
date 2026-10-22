import React, { useState, useEffect, useRef } from 'react';
import type { PadelClub } from '../types/padel';
import { clubService } from '../services/clubService';
import { Search, MapPin, Plus, Check, X, ChevronDown, Building2, Sparkles } from 'lucide-react';

export interface ClubSelectComboboxProps {
  multiple?: boolean;
  value?: string;
  onChange?: (clubName: string, club?: PadelClub) => void;
  values?: string[];
  onMultipleChange?: (clubNames: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

export const ClubSelectCombobox: React.FC<ClubSelectComboboxProps> = ({
  multiple = false,
  value = '',
  onChange,
  values = [],
  onMultipleChange,
  placeholder,
  label,
  required = false,
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<'all' | 'La Serena' | 'Coquimbo'>('all');
  const [clubs, setClubs] = useState<PadelClub[]>(() => clubService.getClubs());
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customClubName, setCustomClubName] = useState('');
  const [customClubCity, setCustomClubCity] = useState<'La Serena' | 'Coquimbo'>('La Serena');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time clubs updates
  useEffect(() => {
    const unsub = clubService.subscribe(() => {
      setClubs([...clubService.getClubs()]);
    });
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setIsAddingCustom(false);
    }
  }, [isOpen]);

  // Filter clubs based on search query and city
  const filteredClubs = clubs.filter(club => {
    const matchesCity = cityFilter === 'all' || club.city.toLowerCase() === cityFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q ||
      club.name.toLowerCase().includes(q) ||
      club.city.toLowerCase().includes(q) ||
      (club.commune && club.commune.toLowerCase().includes(q)) ||
      (club.address && club.address.toLowerCase().includes(q));
    return matchesCity && matchesQuery;
  });

  const exactMatchExists = clubs.some(
    c => c.name.trim().toLowerCase() === searchQuery.trim().toLowerCase()
  );

  // Handlers for single selection
  const handleSelectSingle = (club: PadelClub) => {
    if (onChange) {
      onChange(club.name, club);
    }
    setIsOpen(false);
  };

  // Handlers for multiple selection
  const handleToggleMultiple = (clubName: string) => {
    if (!onMultipleChange) return;
    const exists = values.some(v => v.toLowerCase() === clubName.toLowerCase());
    let newValues: string[];
    if (exists) {
      newValues = values.filter(v => v.toLowerCase() !== clubName.toLowerCase());
    } else {
      newValues = [...values, clubName];
    }
    onMultipleChange(newValues);
  };

  const handleRemoveChip = (clubName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMultipleChange) {
      onMultipleChange(values.filter(v => v.toLowerCase() !== clubName.toLowerCase()));
    }
  };

  // Add custom club
  const handleAddCustom = (nameToAdd: string, cityToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    try {
      const created = clubService.addCustomClub(trimmed, cityToAdd);
      if (multiple) {
        if (!values.includes(created.name)) {
          onMultipleChange?.([...values, created.name]);
        }
      } else {
        onChange?.(created.name, created);
        setIsOpen(false);
      }
      setSearchQuery('');
      setCustomClubName('');
      setIsAddingCustom(false);
    } catch (e) {
      console.warn('Error adding custom club:', e);
    }
  };

  const laSerenaCount = clubs.filter(c => c.city === 'La Serena').length;
  const coquimboCount = clubs.filter(c => c.city === 'Coquimbo').length;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label style={labelStyle}>
          {label} {required && <span style={{ color: '#ff5252' }}>*</span>}
        </label>
      )}

      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...triggerBoxStyle,
          borderColor: isOpen ? 'var(--team1-primary)' : 'var(--border-subtle)',
          boxShadow: isOpen ? '0 0 0 2px rgba(0, 230, 118, 0.2)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
          <Building2 size={16} color="var(--team1-primary)" style={{ flexShrink: 0 }} />

          {multiple ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
              {values.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {placeholder || 'Selecciona uno o más clubes donde juegan...'}
                </span>
              ) : (
                values.map(val => (
                  <span key={val} style={chipStyle}>
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveChip(val, e)}
                      style={chipRemoveBtn}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          ) : (
            <span style={{
              color: value ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: value ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {value || placeholder || 'Seleccionar club de La Serena o Coquimbo...'}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        />
      </div>

      {/* Floating Listbox Dropdown */}
      {isOpen && (
        <div style={dropdownContainerStyle}>
          {/* Header & Search */}
          <div style={{ padding: '12px 12px 8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={searchBoxWrapper}>
              <Search size={15} color="var(--text-muted)" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar club, sector o dirección..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={searchInputStyle}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* City Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setCityFilter('all')}
                style={{
                  ...cityTabBtn,
                  background: cityFilter === 'all' ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                  color: cityFilter === 'all' ? '#000' : 'var(--text-muted)',
                  fontWeight: cityFilter === 'all' ? 800 : 500
                }}
              >
                Todos ({clubs.length})
              </button>
              <button
                type="button"
                onClick={() => setCityFilter('La Serena')}
                style={{
                  ...cityTabBtn,
                  background: cityFilter === 'La Serena' ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                  color: cityFilter === 'La Serena' ? '#000' : 'var(--text-muted)',
                  fontWeight: cityFilter === 'La Serena' ? 800 : 500
                }}
              >
                📍 La Serena ({laSerenaCount})
              </button>
              <button
                type="button"
                onClick={() => setCityFilter('Coquimbo')}
                style={{
                  ...cityTabBtn,
                  background: cityFilter === 'Coquimbo' ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                  color: cityFilter === 'Coquimbo' ? '#000' : 'var(--text-muted)',
                  fontWeight: cityFilter === 'Coquimbo' ? 800 : 500
                }}
              >
                📍 Coquimbo ({coquimboCount})
              </button>
            </div>
          </div>

          {/* Quick Option to Add Search Query as a New Custom Club if not exactly matched */}
          {searchQuery.trim().length > 1 && !exactMatchExists && (
            <div
              onClick={() => handleAddCustom(searchQuery.trim(), cityFilter === 'all' ? 'La Serena' : cityFilter)}
              style={addCustomBannerStyle}
            >
              <Plus size={16} color="var(--team1-primary)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-main)' }}>
                  + Usar / Agregar "{searchQuery.trim()}"
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Club no listado. Se guardará para {cityFilter === 'all' ? 'La Serena' : cityFilter}.
                </div>
              </div>
            </div>
          )}

          {/* Clubs Scrollable List */}
          <div style={clubListScrollStyle}>
            {filteredClubs.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>🎾</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  No se encontró ningún club
                </div>
                <div style={{ fontSize: '0.76rem', marginBottom: '12px' }}>
                  ¿Juegas en otro club? Agrégalo con el botón de abajo.
                </div>
              </div>
            ) : (
              filteredClubs.map(club => {
                const isSelected = multiple
                  ? values.some(v => v.toLowerCase() === club.name.toLowerCase())
                  : value.toLowerCase() === club.name.toLowerCase();

                return (
                  <div
                    key={club.id}
                    onClick={() => {
                      if (multiple) {
                        handleToggleMultiple(club.name);
                      } else {
                        handleSelectSingle(club);
                      }
                    }}
                    style={{
                      ...clubItemStyle,
                      background: isSelected ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--team1-primary)' : '3px solid transparent'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {club.name}
                        </span>
                        <span style={{
                          ...cityBadgeStyle,
                          background: club.city === 'La Serena' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                          color: club.city === 'La Serena' ? '#64b5f6' : '#ffb74d'
                        }}>
                          {club.city}
                        </span>
                        {club.courtsCount && (
                          <span style={courtCountBadge}>
                            {club.courtsCount} canchas
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <MapPin size={11} /> {club.address || club.commune}
                        </span>
                        {club.instagram && (
                          <span style={{ color: 'var(--team1-primary)' }}>
                            {club.instagram}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: multiple ? '4px' : '50%',
                      border: isSelected ? '2px solid var(--team1-primary)' : '2px solid var(--border-subtle)',
                      background: isSelected ? 'var(--team1-primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={13} color="#000" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Add Other Club Form / Button */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
            {!isAddingCustom ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  style={addCustomTriggerBtn}
                >
                  <Plus size={14} />
                  <span>+ Ingresar un club que no está en la lista</span>
                </button>

                {multiple && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={confirmSelectionBtn}
                  >
                    Listo ({values.length})
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color="var(--team1-primary)" />
                  <span>Agregar Nuevo Club a la Base de Datos</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Nombre del club..."
                    value={customClubName}
                    onChange={e => setCustomClubName(e.target.value)}
                    style={{ ...searchInputStyle, flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
                    autoFocus
                  />
                  <select
                    value={customClubCity}
                    onChange={e => setCustomClubCity(e.target.value as any)}
                    style={{ ...searchInputStyle, width: '120px', padding: '7px 8px', fontSize: '0.8rem' }}
                  >
                    <option value="La Serena">La Serena</option>
                    <option value="Coquimbo">Coquimbo</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setCustomClubName('');
                    }}
                    style={{ ...btnSmall, background: 'transparent', color: 'var(--text-muted)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCustom(customClubName, customClubCity)}
                    disabled={!customClubName.trim()}
                    style={{
                      ...btnSmall,
                      background: customClubName.trim() ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                      color: customClubName.trim() ? '#000' : 'var(--text-muted)',
                      fontWeight: 700
                    }}
                  >
                    Guardar y Seleccionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  marginBottom: '6px'
};

const triggerBoxStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '44px',
  padding: '8px 12px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease'
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 8px',
  borderRadius: '8px',
  background: 'rgba(0, 230, 118, 0.15)',
  color: 'var(--team1-primary)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  fontSize: '0.78rem',
  fontWeight: 700
};

const chipRemoveBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  color: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center'
};

const dropdownContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  right: 0,
  zIndex: 1050,
  background: 'var(--bg-surface)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '14px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '420px'
};

const searchBoxWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  background: 'var(--bg-elevated)',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)'
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-main)',
  fontSize: '0.85rem'
};

const cityTabBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '0.72rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const addCustomBannerStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(0, 230, 118, 0.08)',
  borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer'
};

const clubListScrollStyle: React.CSSProperties = {
  overflowY: 'auto',
  maxHeight: '230px',
  display: 'flex',
  flexDirection: 'column'
};

const clubItemStyle: React.CSSProperties = {
  padding: '10px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  transition: 'background 0.15s ease'
};

const cityBadgeStyle: React.CSSProperties = {
  fontSize: '0.66rem',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
};

const courtCountBadge: React.CSSProperties = {
  fontSize: '0.66rem',
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: '6px',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--text-muted)'
};

const addCustomTriggerBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--team1-primary)',
  fontWeight: 700,
  fontSize: '0.78rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 0'
};

const confirmSelectionBtn: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '8px',
  background: 'var(--team1-primary)',
  color: '#000',
  fontWeight: 800,
  fontSize: '0.78rem',
  border: 'none',
  cursor: 'pointer'
};

const btnSmall: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '0.78rem',
  border: 'none',
  cursor: 'pointer'
};
