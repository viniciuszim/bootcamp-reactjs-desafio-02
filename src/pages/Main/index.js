import React, { Component } from 'react';
import moment from 'moment';
import api from '../../services/api';

import logo from '../../assets/logo.png';

import { Container, Form } from './styles';

import CompareList from '../../components/CompareList';

export default class Main extends Component {
  state = {
    loading: false,
    repositoryError: false,
    repositoryInput: '',
    repositories: [],
  };

  componentWillMount() {
    if (typeof Storage !== 'undefined') {
      if (
        localStorage.getItem('repositories') !== null
        && localStorage.getItem('repositories') !== ''
      ) {
        const repositoriesLocal = JSON.parse(localStorage.getItem('repositories'));
        if (repositoriesLocal.length > 0) {
          this.setState({ repositories: repositoriesLocal });
        }
      }
    }
  }

  handleAddRepository = async (e) => {
    e.preventDefault();

    this.setState({ loading: true });

    const { repositoryInput, repositories } = this.state;

    try {
      const { data: repository } = await api.get(`/repos/${repositoryInput}`);

      repository.lastCommit = moment(repository.pushed_at).fromNow();

      this.setState({
        repositoryError: false,
        repositoryInput: '',
        repositories: [...repositories, repository],
      });

      if (typeof Storage !== 'undefined') {
        // Code for localStorage/sessionStorage.
        localStorage.setItem('repositories', JSON.stringify([...repositories, repository]));
      }
    } catch (err) {
      this.setState({ repositoryError: true });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleRefreshRepository = async (repository) => {
    const repositoriesString = localStorage.getItem('repositories');
    // Array in localStorage
    const listRepo = JSON.parse(repositoriesString);
    try {
      // Find index of object in array to update
      const index = listRepo.findIndex(item => item.id === repository.id);
      // Create new object
      const listRepoNew = [...listRepo];
      // get update data in repository api
      const { data: repositoryUpdated } = await api.get(`/repos/${repository.full_name}`);
      // convert data pushed to last commit
      repositoryUpdated.lastCommit = moment(repositoryUpdated.pushed_at).fromNow();
      // update new object in array
      listRepoNew[index] = repositoryUpdated;
      // set array in local storage
      localStorage.setItem('repositories', JSON.stringify(listRepoNew));
      // refresh force page
      this.setState({ repositories: listRepoNew });
    } catch (e) {
      // set array in local storage
      localStorage.setItem('storageRepositories', JSON.stringify(listRepo));
      // refresh force page
      this.setState({ repositories: listRepo });
    }
  };

  handleRemoveRepository = async (repository) => {
    const repositoriesString = localStorage.getItem('repositories');
    try {
      const listRepo = JSON.parse(repositoriesString);
      const listRepoNew = listRepo.filter(item => item.id !== repository.id);
      localStorage.setItem('repositories', JSON.stringify(listRepoNew));
      this.setState({ repositories: listRepoNew });
    } catch (e) {
      localStorage.setItem('repositories', '');
    }
  };

  render() {
    const {
      repositories, repositoryInput, repositoryError, loading,
    } = this.state;

    return (
      <Container>
        <img src={logo} alt="Github Compare" />

        <Form withError={repositoryError} onSubmit={this.handleAddRepository}>
          <input
            type="text"
            placeholder="usuário/repositório"
            value={repositoryInput}
            onChange={e => this.setState({ repositoryInput: e.target.value })}
          />
          <button type="submit">{loading ? <i className="fa fa-spinner fa-pulse" /> : 'OK'}</button>
        </Form>

        <CompareList
          repositories={repositories}
          refresh={this.handleRefreshRepository}
          remove={this.handleRemoveRepository}
        />
      </Container>
    );
  }
}
