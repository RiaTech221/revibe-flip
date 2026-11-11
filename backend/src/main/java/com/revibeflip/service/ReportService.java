package com.revibeflip.service;

import com.revibeflip.dto.CreateReportRequest;
import com.revibeflip.dto.ReportDto;
import com.revibeflip.entity.Product;
import com.revibeflip.entity.Report;
import com.revibeflip.entity.User;
import com.revibeflip.entity.enums.ReportStatus;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.ReportRepository;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de traitement des signalements d'utilisateurs et modération de contenu.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional
    public ReportDto createReport(CreateReportRequest request, User reporter) {
        User reportedUser = null;
        if (request.getReportedUserId() != null) {
            reportedUser = userRepository.findById(request.getReportedUserId()).orElse(null);
        }

        Product reportedProduct = null;
        if (request.getReportedProductId() != null) {
            reportedProduct = productRepository.findById(request.getReportedProductId()).orElse(null);
            if (reportedProduct != null && reportedUser == null) {
                reportedUser = reportedProduct.getSeller();
            }
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportedProduct(reportedProduct)
                .reason(request.getReason())
                .details(request.getDetails())
                .status(ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        return ReportDto.fromEntity(saved);
    }

    public List<ReportDto> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ReportDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReportDto> getPendingReports() {
        return reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING)
                .stream()
                .map(ReportDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReportDto resolveReport(Long reportId, ReportStatus status, String adminNotes) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Signalement non trouvé."));

        report.setStatus(status);
        report.setAdminNotes(adminNotes);
        report.setResolvedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);
        return ReportDto.fromEntity(saved);
    }
}
