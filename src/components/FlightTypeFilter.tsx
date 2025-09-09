
import React from 'react';

interface FlightTypeFilterProps {
  selectedFlightType: 'all' | 'direct' | 'connecting';
  onFlightTypeChange: (type: 'all' | 'direct' | 'connecting') => void;
}

const FlightTypeFilter: React.FC<FlightTypeFilterProps> = ({ selectedFlightType, onFlightTypeChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex-1">
      <h3 className="text-lg font-semibold text-blue-600 mb-3">Lọc theo loại chuyến bay VNA</h3>
      <div className="flex gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="all"
            checked={selectedFlightType === 'all'}
            onChange={(e) => onFlightTypeChange(e.target.value as 'all')}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700">Tất cả</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="direct"
            checked={selectedFlightType === 'direct'}
            onChange={(e) => onFlightTypeChange(e.target.value as 'direct')}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700">Bay thẳng</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="connecting"
            checked={selectedFlightType === 'connecting'}
            onChange={(e) => onFlightTypeChange(e.target.value as 'connecting')}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700">Nối chuyến</span>
        </label>
      </div>
    </div>
  );
};

export default FlightTypeFilter;
