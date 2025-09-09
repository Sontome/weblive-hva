
import React from 'react';

interface AirlineFilterProps {
  selectedAirline: 'all' | 'VJ' | 'VNA';
  onAirlineChange: (airline: 'all' | 'VJ' | 'VNA') => void;
}

const AirlineFilter: React.FC<AirlineFilterProps> = ({ selectedAirline, onAirlineChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex-1">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Lọc theo hãng hàng không</h3>
      <div className="flex gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="all"
            checked={selectedAirline === 'all'}
            onChange={(e) => onAirlineChange(e.target.value as 'all')}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700 font-bold">Tất cả</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="VJ"
            checked={selectedAirline === 'VJ'}
            onChange={(e) => onAirlineChange(e.target.value as 'VJ')}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700 flex items-center font-bold">
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs mr-2 font-bold">VJ</span>
            VietJet
          </span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="VNA"
            checked={selectedAirline === 'VNA'}
            onChange={(e) => onAirlineChange(e.target.value as 'VNA')}
            className="mr-2 text-blue-600"
          />
          <span className="text-gray-700 flex items-center font-bold">
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2 font-bold">VNA</span>
            Vietnam Airlines
          </span>
        </label>
      </div>
    </div>
  );
};

export default AirlineFilter;
