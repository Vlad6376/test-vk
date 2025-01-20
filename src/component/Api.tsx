import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../App.css';
import { Stack, Box, TextField, Button, ButtonGroup } from '@mui/material';

interface Repository {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    editing?: boolean;
    newName?: string;
    newDescription?: string | null;
}

function Api() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [currentPage, setCurrentPage] = useState(10);
  const [reposPerPage] = useState(2);
  const [loading, setLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const loadReposFromLocalStorage = () => {
      const storedRepos = localStorage.getItem('repos');
      return storedRepos ? JSON.parse(storedRepos) as Repository[] : [];
  };

  const saveReposToLocalStorage = (reposToSave: Repository[]) => {
      localStorage.setItem('repos', JSON.stringify(reposToSave));
  };


  useEffect(() => {
    const initialRepos = loadReposFromLocalStorage();
    if (initialRepos.length > 0) {
      setRepos(initialRepos);
      setLoading(false);
    } else {
      loadMoreRepos();
    }
  }, []);


  useEffect(() => {
      saveReposToLocalStorage(repos);
  }, [repos]);

  const loadMoreRepos = useCallback(async () => {
    if (isFetching) return;

    setIsFetching(true);
    try {
      const response = await fetch(`https://api.github.com/users/facebook/repos?page=${currentPage}&per_page=${reposPerPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const linkHeader = response.headers.get('Link');
      let newTotalPages = totalPages; 
  
      if (linkHeader) {
        const lastLink = linkHeader.split(',').find(link => link.includes('rel="last"'));
        if (lastLink) {
          const urlParams = new URLSearchParams(lastLink.match(/<([^>]+)>/)?.[1]?.split("?")[1] || '');
          newTotalPages = Number(urlParams.get('page')) || 1 ;
        }
      }
  
      setTotalPages(newTotalPages);
      const data = await response.json() as Repository[];
      const existingRepoIds = new Set(repos.map(repo => repo.id));
      const newData = data.filter(repo => !existingRepoIds.has(repo.id));

      setRepos((prevRepos) => {
          if (currentPage === 1 && !localStorage.getItem('repos')) {
              return newData;
          } else {
              return [...prevRepos, ...newData];
          }
      });


      setCurrentPage((prevPage) => prevPage + 1);


  } catch (error) {
      console.error("Error fetching data:", error);
  } finally {
      setIsFetching(false);
      setLoading(false);
  }
}, [currentPage, reposPerPage, isFetching, totalPages, repos]);



  const handleEdit = useCallback((repoId: number) => {
      setRepos((prevRepos) =>
          prevRepos.map((repo) =>
              repo.id === repoId ? { ...repo, editing: !repo.editing } : repo
          )
      );
  }, []);

  const handleInputChange = useCallback((repoId: number, field: 'newName' | 'newDescription', value: string) => {
      setRepos((prevRepos) =>
          prevRepos.map((repo) =>
              repo.id === repoId ? { ...repo, [field]: value } : repo
          )
      );
  }, []);

  const handleSave = useCallback((repoId: number) => {
      setRepos((prevRepos) =>
          prevRepos.map((repo) => {
              if (repo.id === repoId) {
                  return {
                      ...repo,
                      name: repo.newName || repo.name,
                      description: repo.newDescription || repo.description,
                      editing: false,
                      newName: undefined,
                      newDescription: undefined,
                  };
              }
              return repo;
          })
      );
  }, []);


  const handleDelete = useCallback((repoId: number) => {
      setRepos((prevRepos) => prevRepos.filter((repo) => repo.id !== repoId));
  }, []);

  const lastPostRef = useCallback((node: Element | null) => {
    if (node) {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        observerRef.current = new IntersectionObserver(async (entries) => {
            if (entries[0].isIntersecting && !isFetching && currentPage <= totalPages) {
                loadMoreRepos();
            }
        });
        if (observerRef.current) {
            observerRef.current.observe(node);
        }

    }

}, [isFetching, loadMoreRepos, totalPages, currentPage]);


  return (
    <div className="Api">
        <h1 className='header'>Репозитории GitHub</h1>
      {repos.map((repo, index) => (
        <Box
          key={repo.id}
          mb={2}
          ref={index === repos.length - 1 ? lastPostRef : null}
          className="repo-box"
        >

          {repo.editing ? (
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={repo.newName || repo.name}
                onChange={(e) => handleInputChange(repo.id, 'newName', e.target.value)}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={repo.newDescription || repo.description}
                onChange={(e) => handleInputChange(repo.id, 'newDescription', e.target.value)}
              />
              <Button className='save-btn' onClick={() => handleSave(repo.id)}>Сохранить</Button>
            </Stack>
          ) : (
            <>
              <h3><a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a></h3>
              <p>{repo.description}</p>
              <ButtonGroup variant="contained" aria-label="outlined primary button group"> {/* ButtonGroup here */}
                <Button className='edit-btn' onClick={() => handleEdit(repo.id)}>Изменить</Button>
                <Button className='delete-btn' onClick={() => handleDelete(repo.id)}>Удалить</Button>
              </ButtonGroup>
            </>
          )}
        </Box>
      ))}
          <Stack spacing={2} sx={{display: loading || currentPage === totalPages? 'none': 'block'}}>
          </Stack>
          {isFetching && <p>Loading...</p>}
    </div>
  );
}

export default Api;

