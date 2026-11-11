package com.revibeflip.service;

import com.revibeflip.dto.AddressDto;
import com.revibeflip.dto.AddressRequest;
import com.revibeflip.entity.Address;
import com.revibeflip.entity.User;
import com.revibeflip.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    private final AddressRepository addressRepository;

    @Transactional(readOnly = true)
    public List<AddressDto> getMyAddresses(User user) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId())
                .stream()
                .map(AddressDto::fromEntity)
                .toList();
    }

    @Transactional
    public AddressDto createAddress(User user, AddressRequest request) {
        boolean isFirst = addressRepository.countByUserId(user.getId()) == 0;
        boolean makeDefault = isFirst || Boolean.TRUE.equals(request.getIsDefault());

        if (makeDefault) {
            unsetPreviousDefault(user.getId());
        }

        Address address = Address.builder()
                .user(user)
                .title(request.getTitle().trim())
                .recipientName(request.getRecipientName().trim())
                .phone(request.getPhone().trim())
                .city(request.getCity().trim())
                .addressLine(request.getAddressLine().trim())
                .isDefault(makeDefault)
                .build();

        Address saved = addressRepository.save(address);
        log.info("Nouvelle adresse créée pour l'utilisateur #{} : {}", user.getId(), saved.getTitle());
        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public AddressDto updateAddress(User user, Long addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Adresse non trouvée ou non autorisée"));

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            unsetPreviousDefault(user.getId());
            address.setIsDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault()) && Boolean.TRUE.equals(address.getIsDefault())) {
            address.setIsDefault(false);
        }

        address.setTitle(request.getTitle().trim());
        address.setRecipientName(request.getRecipientName().trim());
        address.setPhone(request.getPhone().trim());
        address.setCity(request.getCity().trim());
        address.setAddressLine(request.getAddressLine().trim());

        Address saved = addressRepository.save(address);
        log.info("Adresse #{} mise à jour pour l'utilisateur #{}", addressId, user.getId());
        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public void deleteAddress(User user, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Adresse non trouvée ou non autorisée"));

        addressRepository.delete(address);
        log.info("Adresse #{} supprimée pour l'utilisateur #{}", addressId, user.getId());
    }

    @Transactional
    public AddressDto setDefaultAddress(User user, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Adresse non trouvée ou non autorisée"));

        unsetPreviousDefault(user.getId());
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);
        return AddressDto.fromEntity(saved);
    }

    private void unsetPreviousDefault(Long userId) {
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        for (Address a : addresses) {
            if (Boolean.TRUE.equals(a.getIsDefault())) {
                a.setIsDefault(false);
                addressRepository.save(a);
            }
        }
    }
}
