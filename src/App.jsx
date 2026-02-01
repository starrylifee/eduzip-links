import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import * as Hangul from 'hangul-js';
import { Search, Download, ExternalLink, SortAsc, LayoutGrid, List, SortDesc, Calendar } from 'lucide-react';
import data from './data.json';

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('gallery'); // 'gallery', 'list'
    const [sortOrder, setSortOrder] = useState('upload_desc'); // 'upload_desc', 'upload_asc', 'name'
    const [notification, setNotification] = useState(null);

    const fuse = useMemo(() => {
        return new Fuse(data, {
            keys: ['name'],
            threshold: 0.4,
            ignoreLocation: true,
        });
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return data;

        const isChosung = /^[ㄱ-ㅎ]+$/.test(searchTerm);
        if (isChosung) {
            return data.filter(item => {
                const itemChosung = Hangul.disassemble(item.name || '').filter(Hangul.isCho).join('');
                return itemChosung.includes(searchTerm);
            });
        }

        return fuse.search(searchTerm).map(result => result.item);
    }, [searchTerm]);

    const sortedItems = useMemo(() => {
        const result = [...filteredItems];
        if (sortOrder === 'name') {
            return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortOrder === 'upload_asc') {
            return result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortOrder === 'upload_desc') {
            return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        return result;
    }, [filteredItems, sortOrder]);

    const getDownloadUrls = (item) => {
        return [
            item.file_url_1,
            item.file_url_2,
            item.file_url_3,
            item.file_url_4,
            item.file_url_5
        ].filter(url => url && url.startsWith('http'));
    };

    const handleDownload = (item) => {
        const urls = getDownloadUrls(item);
        if (urls.length === 0) return;

        if (urls.length > 1) {
            setNotification(`${urls.length}개의 파일이 다운로드됩니다.`);
            setTimeout(() => setNotification(null), 3000);
        }

        urls.forEach((url, index) => {
            // Sequential download to avoid browser blocking
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank'; // Some browsers need this for many files
                link.setAttribute('download', '');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 500);
        });
    };

    return (
        <div className="min-h-screen relative">
            {notification && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce font-medium">
                    {notification}
                </div>
            )}

            <header className="py-12 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-outfit">
                    체크리스트 및 증빙자료 다운로드
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    {data.length}개의 리스트를 검색하고 필요한 자료를 다운로드하세요.
                </p>
            </header>

            <div className="search-container">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="검색어 입력 (초성 검색 지원 예: ㅇㅇㅋㄹ)"
                            className="search-input pl-14"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('gallery')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'gallery' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                            title="갤러리형"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                            title="리스트형"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setSortOrder('upload_desc')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${sortOrder === 'upload_desc' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            최신순
                        </button>
                        <button
                            onClick={() => setSortOrder('upload_asc')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${sortOrder === 'upload_asc' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            오래된순
                        </button>
                        <button
                            onClick={() => setSortOrder('name')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${sortOrder === 'name' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            이름순
                        </button>
                    </div>
                </div>
            </div>

            <main className={viewMode === 'gallery' ? 'grid-container' : 'list-container'}>
                {sortedItems.map((item, index) => {
                    const downloadUrls = getDownloadUrls(item);
                    return (
                        <div key={item.id || index} className={`premium-card ${viewMode === 'gallery' ? 'p-6 flex flex-col justify-between' : 'p-4 flex items-center justify-between gap-4'}`}>
                            <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                                <h3 className={`item-name ${viewMode === 'list' ? 'mb-0 truncate' : 'mb-2'}`}>{item.name || '이름 없음'}</h3>
                                {viewMode === 'gallery' && (
                                    <div className="item-info">
                                        <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            {downloadUrls.length > 1 && (
                                                <span className="ml-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[10px] font-bold">
                                                    FILES ×{downloadUrls.length}
                                                </span>
                                            )}
                                        </div>
                                        {item.url && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:underline mt-2">
                                                <ExternalLink className="w-3.5 h-3.5" /> 관련 링크
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={`flex items-center gap-3 ${viewMode === 'gallery' ? 'mt-4' : ''}`}>
                                {viewMode === 'list' && item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-indigo-400 transition-colors" title="관련 링크">
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                                {downloadUrls.length > 0 && (
                                    <button
                                        onClick={() => handleDownload(item)}
                                        className={viewMode === 'gallery' ? 'download-btn w-full justify-center' : 'download-btn-compact'}
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>다운로드 </span>
                                        {viewMode === 'list' && downloadUrls.length > 1 && (
                                            <span className="ml-1 opacity-70">({downloadUrls.length})</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {sortedItems.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    검색 결과가 없습니다.
                </div>
            )}

            <footer className="footer">
                <p>© 2026 서울신답초등학교 정용석</p>
                <p className="mt-1 opacity-50">Checklist & Evidence Materials Download Service</p>
            </footer>
        </div>
    );
};

export default App;
