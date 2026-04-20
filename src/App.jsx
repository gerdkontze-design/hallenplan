import React, { useState, useEffect } from 'react';
import './App.css';

// Typen definieren
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const START_HOUR = 14;
const END_HOUR = 22;
const TIME_SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => START_HOUR * 60 + i * 30);

const DEFAULT_GROUPS = [
  { id: 'default-1', name: 'Leichtathletik', color: '#F59E0B', icon: '🏃' },
  { id: 'default-2', name: 'Volleyball', color: '#10B981', icon: '🏐' },
  { id: 'default-3', name: 'Basketball', color: '#EF4444', icon: '🏀' },
  { id: 'default-4', name: 'Fußball', color: '#3B82F6', icon: '⚽' },
  { id: 'default-5', name: 'Indiaca', color: '#8B5CF6', icon: '🏓' },
  { id: 'default-6', name: 'Kinderturnen', color: '#EC4899', icon: '🤸' },
  { id: 'default-7', name: 'Taekwondo', color: '#DC2626', icon: '🥋' },
  { id: 'default-8', name: 'Fitness', color: '#06B6D4', icon: '💪' },
  { id: 'default-9', name: 'Zumba', color: '#D946EF', icon: '💃' },
  { id: 'default-10', name: 'Workout', color: '#EA580C', icon: '🏋️' },
  { id: 'default-11', name: 'Gymnastik', color: '#14B8A6', icon: '🧘' },
];

function App() {
  // Lade Daten aus localStorage beim Start
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('hallenplan-groups');
      return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
    } catch {
      return DEFAULT_GROUPS;
    }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('hallenplan-bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(870); // 14:30 in Minuten
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [draggingBookingId, setDraggingBookingId] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('⚽');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState('');
  const [editGroupIcon, setEditGroupIcon] = useState('');

  // Speichere Daten in localStorage
  useEffect(() => {
    localStorage.setItem('hallenplan-bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('hallenplan-groups', JSON.stringify(groups));
  }, [groups]);

  const bookingConflict = (day, startTime, duration, ignoreId = null) => {
    return bookings.some(booking =>
      booking.id !== ignoreId &&
      booking.day === day &&
      booking.startTime < startTime + duration &&
      booking.startTime + booking.duration > startTime
    );
  };

  const addBooking = () => {
    if (!selectedGroup) return;

    if (bookingConflict(selectedDay, selectedTime, selectedDuration)) {
      alert('Konflikt mit bestehender Buchung!');
      return;
    }

    const newBooking = {
      id: Date.now().toString(),
      groupId: selectedGroup,
      day: selectedDay,
      startTime: selectedTime,
      duration: selectedDuration,
    };

    setBookings([...bookings, newBooking]);
  };

  const removeBooking = (bookingId) => {
    setBookings(bookings.filter(booking => booking.id !== bookingId));
  };

  const moveBooking = (bookingId, newDay, newTime) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (bookingConflict(newDay, newTime, booking.duration, bookingId)) {
      alert('Konflikt mit bestehender Buchung!');
      return;
    }

    setBookings(bookings.map(b =>
      b.id === bookingId
        ? { ...b, day: newDay, startTime: newTime }
        : b
    ));
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      color: newGroupColor,
      icon: newGroupIcon,
    };

    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('⚽');
    setShowAddGroup(false);
  };

  const removeGroup = (groupId) => {
    if (confirm(`Sportgruppe wirklich löschen? Alle Buchungen dieser Gruppe werden auch gelöscht.`)) {
      setGroups(groups.filter(g => g.id !== groupId));
      setBookings(bookings.filter(b => b.groupId !== groupId));
    }
  };

  const startEditGroup = (group) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupColor(group.color);
    setEditGroupIcon(group.icon);
  };

  const saveEditGroup = () => {
    if (!editGroupName.trim()) return;
    
    setGroups(groups.map(g =>
      g.id === editingGroupId
        ? { ...g, name: editGroupName.trim(), color: editGroupColor, icon: editGroupIcon }
        : g
    ));
    setEditingGroupId(null);
  };

  const clearAllBookings = () => {
    if (confirm('Alle Buchungen wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setBookings([]);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getBookingAtTime = (day, time) => {
    return bookings.find(booking =>
      booking.day === day &&
      booking.startTime <= time &&
      booking.startTime + booking.duration > time
    );
  };

  const isBookingStart = (booking, time) => booking && booking.startTime === time;

  const getRowSpan = (duration) => {
    // 30 Minuten = 1 Zeile, 60 Minuten = 2 Zeilen, 90 Minuten = 3 Zeilen
    return Math.ceil(duration / 30);
  };

  const handleDragStart = (event, bookingId) => {
    event.dataTransfer.setData('text/plain', bookingId);
    setDraggingBookingId(bookingId);
  };

  const handleDragEnd = () => {
    setDraggingBookingId(null);
    setDragOverCell(null);
  };

  const handleDragOver = (event, day, time) => {
    event.preventDefault();
    setDragOverCell(`${day}-${time}`);
  };

  const handleDrop = (event, day, time) => {
    event.preventDefault();
    const bookingId = event.dataTransfer.getData('text/plain');
    moveBooking(bookingId, day, time);
    setDragOverCell(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🏟️ Turnhallenbelegungsplan
          </h1>
          <p className="text-slate-600">Verwalte deine Sportgruppen und Hallentermine</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sportgruppen */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Sportgruppen
                </h2>
                <button
                  onClick={() => setShowAddGroup(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>

              <div className="space-y-3">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200"
                  >
                    {editingGroupId === group.id ? (
                      <>
                        <input
                          type="text"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          placeholder="Gruppenname"
                        />
                        <input
                          type="color"
                          value={editGroupColor}
                          onChange={(e) => setEditGroupColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                        />
                        <input
                          type="text"
                          value={editGroupIcon}
                          onChange={(e) => setEditGroupIcon(e.target.value)}
                          maxLength="2"
                          className="w-10 h-10 rounded-lg border border-slate-300 text-center text-lg"
                        />
                        <button
                          onClick={saveEditGroup}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          💾
                        </button>
                        <button
                          onClick={() => setEditingGroupId(null)}
                          className="px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          ❌
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: group.color }}
                        >
                          {group.icon}
                        </div>
                        <span className="flex-1 font-medium text-slate-700">{group.name}</span>
                        <button
                          onClick={() => startEditGroup(group)}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                          title="Bearbeiten"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeGroup(group.id)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Neue Buchung */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Neue Buchung
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Sportgruppe</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Gruppe wählen...</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.icon} {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tag</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm"
                    >
                      {DAYS.map((day, index) => (
                        <option key={index} value={index}>{day.slice(0, 3)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Dauer</label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm"
                    >
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Startzeit</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    {TIME_SLOTS.filter(time => time % 30 === 0).map(time => (
                      <option key={time} value={time}>{formatTime(time)}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addBooking}
                  disabled={!selectedGroup}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed font-medium"
                >
                  ➕ Buchung hinzufügen
                </button>

                <button
                  onClick={clearAllBookings}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-medium text-sm mt-2"
                >
                  🗑️ Plan leeren
                </button>
              </div>
            </div>
          </div>

          {/* Hauptbereich - Zeitplan */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Wochenplan
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-xl overflow-hidden shadow-lg table-fixed">
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    {DAYS.map((day, idx) => (
                      <col key={idx} style={{ width: '160px' }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-200">
                      <th className="border border-slate-300 p-4 text-left font-semibold text-slate-700 w-20">Zeit</th>
                      {DAYS.map(day => (
                        <th key={day} className="border border-slate-300 p-4 text-center font-semibold text-slate-700 w-40">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(time => (
                      <tr key={time} className="hover:bg-slate-50/50 transition-colors duration-150 h-12">
                        <td className="border border-slate-300 p-4 bg-gradient-to-r from-slate-50 to-white font-mono text-sm font-medium text-slate-600 w-20 h-12">
                          {formatTime(time)}
                        </td>
                        {DAYS.map((_, dayIndex) => {
                          const booking = getBookingAtTime(dayIndex, time);
                          const isStart = isBookingStart(booking, time);
                          const cellKey = `${dayIndex}-${time}`;
                          const group = booking ? groups.find(g => g.id === booking.groupId) : null;

                          // Wenn es eine Buchung gibt und sie nicht am Start ist, überspringe diese Zelle
                          if (booking && !isStart) {
                            return null;
                          }

                          return (
                            <td
                              key={cellKey}
                              rowSpan={booking ? getRowSpan(booking.duration) : 1}
                              className={`border border-slate-300 p-2 relative transition-all duration-200 w-40 ${booking && !isStart ? 'hidden' : ''} ${
                                dragOverCell === cellKey
                                  ? 'bg-blue-100 shadow-inner ring-2 ring-blue-300'
                                  : 'hover:bg-slate-50'
                              }`}
                              style={{
                                height: booking && isStart ? `${getRowSpan(booking.duration) * 48}px` : '48px',
                                minHeight: '48px'
                              }}
                              onDragOver={(e) => handleDragOver(e, dayIndex, time)}
                              onDrop={(e) => handleDrop(e, dayIndex, time)}
                              onDragLeave={() => setDragOverCell(null)}
                            >
                              {booking && isStart && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeBooking(booking.id);
                                    }}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-20"
                                    title="Termin löschen"
                                    style={{ zIndex: 20 }}
                                  >
                                    ×
                                  </button>
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, booking.id)}
                                    onDragEnd={handleDragEnd}
                                    className="w-full h-full flex flex-col items-center justify-center text-white text-sm font-semibold cursor-move hover:opacity-90 transition-all duration-200 transform hover:scale-105 rounded-xl shadow-lg relative overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, ${group?.color} 0%, ${group?.color}dd 100%)`,
                                      minHeight: `${getRowSpan(booking.duration) * 3}rem`,
                                      boxShadow: `0 4px 20px ${group?.color}40`
                                    }}
                                    title={`${group?.name} (${booking.duration} min) - Ziehen zum Verschieben`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                    <div className="text-center relative z-10">
                                      <div className="text-lg mb-1">{group?.icon}</div>
                                      <div className="font-bold text-sm">{group?.name}</div>
                                      <div className="text-xs opacity-90">{booking.duration} min</div>
                                    </div>
                                  </div>
                                </>
                              )}
                              {!booking && (
                                <div className="w-full h-12 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-slate-200 rounded-full opacity-50"></div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal für neue Gruppe */}
        {showAddGroup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Neue Sportgruppe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="z.B. Handball"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Farbe</label>
                  <input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="w-full h-12 border border-slate-300 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Sport-Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { icon: '⚽', name: 'Fußball' },
                      { icon: '🏀', name: 'Basketball' },
                      { icon: '🏐', name: 'Volleyball' },
                      { icon: '🎾', name: 'Tennis' },
                      { icon: '🏓', name: 'Tischtennis' },
                      { icon: '🏊', name: 'Schwimmen' },
                      { icon: '🚴', name: 'Radfahren' },
                      { icon: '🏃', name: 'Laufen' },
                      { icon: '🥊', name: 'Boxen' },
                      { icon: '🎯', name: 'Zielscheibe' },
                      { icon: '🏸', name: 'Badminton' },
                      { icon: '🏒', name: 'Eishockey' },
                      { icon: '🏉', name: 'Rugby' },
                      { icon: '🎱', name: 'Billard' },
                      { icon: '🏹', name: 'Bogenschießen' },
                      { icon: '⛷️', name: 'Ski' },
                      { icon: '🏂', name: 'Snowboard' },
                      { icon: '🧘', name: 'Yoga' },
                      { icon: '💃', name: 'Zumba' },
                      { icon: '🏓', name: 'Indiaca' },
                    ].map(({ icon, name }) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewGroupIcon(icon)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 transform hover:scale-110 ${
                          newGroupIcon === icon
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                        title={name}
                      >
                        <span className="text-2xl">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={addGroup}
                    disabled={!newGroupName.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed font-medium"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => setShowAddGroup(false)}
                    className="px-6 py-3 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;