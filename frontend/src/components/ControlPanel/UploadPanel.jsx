// CSV 上传面板组件
import { useCallback, useState } from 'react';
import { uploadCSV } from '../../api/api';
import useFlowStore from '../../hooks/useFlowStore';

function UploadPanel() {
    const [isDragging, setIsDragging] = useState(false);
    const { setNodesFromCSV, setLoading, setError, isLoading, error, metadata, clearCanvas } = useFlowStore();

    // 处理文件上传
    const handleUpload = useCallback(async (file) => {
        if (!file) return;

        // 检查文件类型
        if (!file.name.endsWith('.csv')) {
            setError('请上传 CSV 文件');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await uploadCSV(file);
            setNodesFromCSV(result);
        } catch (err) {
            setError(err.message || '上传失败，请检查后端是否运行');
        } finally {
            setLoading(false);
        }
    }, [setNodesFromCSV, setLoading, setError]);

    // 拖拽事件
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleUpload(file);
    }, [handleUpload]);

    // 文件选择
    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        handleUpload(file);
    }, [handleUpload]);

    return (
        <div className="p-4 space-y-4">
            {/* 标题 */}
            <div>
                <h2 className="text-lg font-bold text-gray-800">🌊 CausalFlow</h2>
                <p className="text-xs text-gray-500 mt-1">贝叶斯网络推演平台</p>
            </div>

            {/* 上传区域 */}
            <div
                className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-input').click()}
            >
                <input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="ml-2 text-gray-600">处理中...</span>
                    </div>
                ) : (
                    <>
                        <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">拖拽 CSV 文件到这里</p>
                        <p className="text-xs text-gray-400 mt-1">或点击选择文件</p>
                    </>
                )}
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* 数据信息 */}
            {metadata && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">✓ 数据已加载</p>
                    <p className="text-xs text-green-600 mt-1">
                        {metadata.row_count} 行 × {metadata.column_count} 列
                    </p>
                    <button
                        onClick={clearCanvas}
                        className="mt-2 text-xs text-red-500 hover:text-red-700"
                    >
                        清除数据
                    </button>
                </div>
            )}

            {/* 使用说明 */}
            <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">使用说明：</p>
                <p>1. 上传离散变量 CSV (每列 ≤15 种值)</p>
                <p>2. 节点将自动生成在画布上</p>
                <p>3. 后续可拖拽连线构建网络</p>
            </div>
        </div>
    );
}

export default UploadPanel;
