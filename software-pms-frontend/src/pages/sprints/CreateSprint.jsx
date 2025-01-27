import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateSprint = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    project_id: projectId,
    start_date: '',
    end_date: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/sprints`,
        formData,
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      navigate(`/sprints/${response.data.sprint_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/sprints', { 
      state: { selectedProjectId: parseInt(projectId) } 
    });
  };

  return (
    <div className="bg-gray mt-16">
      <div className="w-full max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Select Sprint</span>
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-50 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Plus className="w-10 h-10 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Create New Sprint</h2>
            </div>
          </div>

          {/* Rest of the component remains the same */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Sprint Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter sprint name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    required
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>{loading ? 'Creating...' : 'Create Sprint'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSprint;